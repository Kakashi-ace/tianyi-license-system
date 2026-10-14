const express = require('express');
const router = express.Router();
const pool = require('../db');
const {
  isDeviceBlacklisted,
  deviceBlacklistGuard,
  activationRateLimiter,
  recordFailedActivation,
  clearFailedActivation,
  signLicenseToken
} = require('../security');

function formatDateTime(d) {
  const pad = n => String(n).padStart(2, '0');
  const d8 = new Date(d.getTime() + (8 * 60 + d.getTimezoneOffset()) * 60000);
  return `${d8.getFullYear()}-${pad(d8.getMonth() + 1)}-${pad(d8.getDate())} ${pad(d8.getHours())}:${pad(d8.getMinutes())}:${pad(d8.getSeconds())}`;
}

router.post('/activate', deviceBlacklistGuard, activationRateLimiter, async (req, res) => {
  const cardKey = req.body.cardKey || req.body.card_key || '';
  const machineId = req.body.machineId || req.body.hwid || '';
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '';

  if (!cardKey || !cardKey.trim()) {
    return res.status(400).json({ success: false, message: '卡密不能为空' });
  }
  if (!machineId || !machineId.trim()) {
    return res.status(400).json({ success: false, message: '设备机器码识别失败' });
  }

  const cleanKey = cardKey.trim().toUpperCase();
  const cleanMachine = machineId.trim();

  try {
    const [cards] = await pool.query('SELECT * FROM t_card_key WHERE card_key = ?', [cleanKey]);
    if (cards.length === 0) {
      recordFailedActivation(req.rateLimitKey);
      await pool.query(
        'INSERT INTO t_activation_log (card_key, machine_id, ip, action, status, message) VALUES (?, ?, ?, ?, ?, ?)',
        [cleanKey, cleanMachine, ip, 'ACTIVATE', 'FAILED', '卡密不存在']
      );
      return res.status(404).json({ success: false, message: '无效卡密，请核对后重试或联系客服购买' });
    }

    const card = cards[0];
    if (card.status === 'DISABLED') {
      return res.status(403).json({ success: false, message: '该卡密已被系统禁用，请联系客服处理' });
    }

    const now = new Date();

    if (card.status === 'ACTIVATED') {
      if (card.machine_id && card.machine_id !== cleanMachine) {
        await pool.query(
          'INSERT INTO t_activation_log (card_key, machine_id, ip, action, status, message) VALUES (?, ?, ?, ?, ?, ?)',
          [cleanKey, cleanMachine, ip, 'ACTIVATE', 'FAILED', '卡密已被其他设备绑定']
        );
        return res.status(409).json({
          success: false,
          code: 'CARD_BOUND_OTHER_DEVICE',
          message: '该卡密已在其他设备绑定激活，严禁一卡多机！如需换绑请联系客服'
        });
      }

      const expireDate = new Date(card.expire_at);
      if (expireDate <= now) {
        await pool.query('UPDATE t_card_key SET status = "EXPIRED" WHERE id = ?', [card.id]);
        return res.status(410).json({ success: false, message: '该卡密已过有效期，请联系客服续期购买' });
      }

      if (!card.machine_id) {
        const [bindRes] = await pool.query(
          'UPDATE t_card_key SET machine_id = ? WHERE id = ? AND (machine_id IS NULL OR machine_id = ?)',
          [cleanMachine, card.id, cleanMachine]
        );
        if (bindRes.affectedRows === 0) {
          return res.status(409).json({
            success: false,
            code: 'CARD_BOUND_OTHER_DEVICE',
            message: '该卡密已被其他设备抢先绑定，严禁一卡多用！'
          });
        }
      }

      clearFailedActivation(req.rateLimitKey);
      const remSec = Math.max(0, Math.floor((expireDate.getTime() - now.getTime()) / 1000));
      const expSec = Math.floor(expireDate.getTime() / 1000);
      const token = signLicenseToken(cleanMachine, expSec, card.package_name || 'VIP');

      return res.json({
        success: true,
        is_activated: true,
        is_trial_valid: true,
        license_type: card.package_name || 'VIP',
        expires_at: expSec,
        remaining_seconds: remSec,
        message: '激活绑定成功',
        cardKey: card.card_key,
        packageName: card.package_name,
        expireAt: card.expire_at,
        expireTimestamp: expireDate.getTime(),
        token
      });
    }

    if (card.status === 'EXPIRED') {
      return res.status(410).json({ success: false, message: '该卡密已失效过期' });
    }

    const expireDate = new Date(now.getTime() + card.duration_days * 24 * 60 * 60 * 1000);
    const expireStr = formatDateTime(expireDate);
    const nowStr = formatDateTime(now);

    const [updateResult] = await pool.query(
      'UPDATE t_card_key SET status = "ACTIVATED", machine_id = ?, activated_at = ?, expire_at = ? WHERE id = ? AND status = "UNUSED"',
      [cleanMachine, nowStr, expireStr, card.id]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(409).json({ success: false, code: 'CARD_ALREADY_USED', message: '卡密已被使用，一卡只能使用一次！' });
    }

    clearFailedActivation(req.rateLimitKey);
    await pool.query(
      'INSERT INTO t_activation_log (card_key, machine_id, ip, action, status, message) VALUES (?, ?, ?, ?, ?, ?)',
      [cleanKey, cleanMachine, ip, 'ACTIVATE', 'SUCCESS', `激活成功，有效期 ${card.duration_days} 天`]
    );

    const remSec = Math.max(0, Math.floor((expireDate.getTime() - now.getTime()) / 1000));
    const expSec = Math.floor(expireDate.getTime() / 1000);
    const token = signLicenseToken(cleanMachine, expSec, card.package_name || 'VIP');

    res.json({
      success: true,
      is_activated: true,
      is_trial_valid: true,
      license_type: card.package_name || 'VIP',
      expires_at: expSec,
      remaining_seconds: remSec,
      message: '恭喜！卡密授权激活成功',
      cardKey: card.card_key,
      packageName: card.package_name,
      durationDays: card.duration_days,
      expireAt: expireStr,
      expireTimestamp: expireDate.getTime(),
      token
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '激活处理异常: ' + err.message });
  }
});

router.post(['/verify', '/check'], deviceBlacklistGuard, async (req, res) => {
  const cardKey = req.body.cardKey || req.body.card_key || '';
  const machineId = req.body.machineId || req.body.hwid || '';

  if (!cardKey || !machineId) {
    return handleTrialCheck(machineId, req, res);
  }

  const cleanKey = cardKey.trim().toUpperCase();
  const cleanMachine = machineId.trim();

  try {
    const [cards] = await pool.query('SELECT * FROM t_card_key WHERE card_key = ?', [cleanKey]);
    if (cards.length === 0) {
      return res.status(404).json({ success: false, isValid: false, message: '卡密不存在' });
    }

    const card = cards[0];
    if (card.status !== 'ACTIVATED') {
      return res.status(400).json({ success: false, isValid: false, message: '卡密尚未激活或已失效' });
    }

    if (!card.machine_id) {
      return res.json({
        success: false,
        isValid: false,
        is_activated: false,
        is_unbound: true,
        code: 'CARD_UNBOUND',
        message: '该卡密已被管理员解绑，请重新绑定或输入卡密激活'
      });
    }

    if (card.machine_id !== cleanMachine) {
      return res.status(409).json({
        success: false,
        isValid: false,
        code: 'CARD_MACHINE_MISMATCH',
        message: '卡密与当前设备机器码不匹配，严禁一卡多设备使用！'
      });
    }

    const now = new Date();
    const expireDate = new Date(card.expire_at);
    if (expireDate <= now) {
      await pool.query('UPDATE t_card_key SET status = "EXPIRED" WHERE id = ?', [card.id]);
      return res.status(410).json({ success: false, isValid: false, message: '卡密已到期' });
    }

    const remSec = Math.max(0, Math.floor((expireDate.getTime() - now.getTime()) / 1000));
    const expSec = Math.floor(expireDate.getTime() / 1000);
    const token = signLicenseToken(cleanMachine, expSec, card.package_name || 'VIP');

    res.json({
      success: true,
      isValid: true,
      is_activated: true,
      is_trial_valid: true,
      license_type: card.package_name || 'VIP',
      expires_at: expSec,
      remaining_seconds: remSec,
      cardKey: card.card_key,
      packageName: card.package_name,
      expireAt: card.expire_at,
      expireTimestamp: expireDate.getTime(),
      token
    });
  } catch (err) {
    res.status(500).json({ success: false, isValid: false, message: err.message });
  }
});

async function handleTrialCheck(machineId, req, res) {
  if (!machineId || !machineId.trim() || machineId.trim().length < 10) {
    return res.status(400).json({ success: false, is_activated: false, is_trial_valid: false, message: '无效设备机器码标识' });
  }

  const cleanMachine = machineId.trim();
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '';

  try {
    if (ip && ip !== '127.0.0.1') {
      const [ipRows] = await pool.query(
        'SELECT COUNT(*) as cnt FROM t_trial_record WHERE ip = ? AND start_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)',
        [ip]
      );
      if (ipRows && ipRows[0] && ipRows[0].cnt >= 3) {
        return res.status(429).json({
          success: false,
          is_activated: false,
          is_trial_valid: false,
          remaining_seconds: 0,
          code: 'IP_TRIAL_LIMIT_EXCEEDED',
          message: '当前网络 IP 24 小时内试用申请次数已达上限，请购买卡密激活使用或联系客服'
        });
      }
    }

    const now = new Date();
    const [cards] = await pool.query(
      'SELECT * FROM t_card_key WHERE machine_id = ? AND status = "ACTIVATED" AND expire_at > NOW() ORDER BY expire_at DESC LIMIT 1',
      [cleanMachine]
    );
    if (cards.length > 0) {
      const card = cards[0];
      const expireDate = new Date(card.expire_at);
      const remSec = Math.max(0, Math.floor((expireDate.getTime() - now.getTime()) / 1000));
      const expSec = Math.floor(expireDate.getTime() / 1000);
      const token = signLicenseToken(cleanMachine, expSec, card.package_name || 'VIP');
      return res.json({
        success: true,
        is_activated: true,
        is_trial_valid: true,
        license_type: card.package_name || 'VIP',
        expires_at: expSec,
        remaining_seconds: remSec,
        message: '商业授权有效',
        cardKey: card.card_key,
        packageName: card.package_name,
        expireAt: card.expire_at,
        expireTimestamp: expireDate.getTime(),
        token
      });
    }

    const [trials] = await pool.query('SELECT * FROM t_trial_record WHERE machine_id = ?', [cleanMachine]);

    if (trials.length > 0) {
      const record = trials[0];
      const expireDate = new Date(record.expire_time);
      if (expireDate > now) {
        const remainingSeconds = Math.max(1, Math.floor((expireDate.getTime() - now.getTime()) / 1000));
        const expSec = Math.floor(expireDate.getTime() / 1000);
        return res.json({
          success: true,
          is_activated: false,
          is_trial_valid: true,
          license_type: 'TRIAL',
          expires_at: expSec,
          remaining_seconds: remainingSeconds,
          trialExpireAt: record.expire_time,
          trialExpireTimestamp: expireDate.getTime(),
          token: signLicenseToken(cleanMachine, expSec, 'TRIAL'),
          message: `正在试用中，剩余 ${Math.ceil(remainingSeconds / 60)} 分钟`
        });
      } else {
        return res.json({
          success: false,
          is_activated: false,
          is_trial_valid: false,
          remaining_seconds: 0,
          code: 'TRIAL_EXPIRED',
          message: '您的 1 小时免费试用已结束，请联系客服购买卡密激活'
        });
      }
    }

    const expireDate = new Date(now.getTime() + 60 * 60 * 1000);
    const nowStr = formatDateTime(now);
    const expireStr = formatDateTime(expireDate);

    await pool.query(
      'INSERT INTO t_trial_record (machine_id, start_time, expire_time, ip) VALUES (?, ?, ?, ?)',
      [cleanMachine, nowStr, expireStr, ip]
    );

    await pool.query(
      'INSERT INTO t_activation_log (card_key, machine_id, ip, action, status, message) VALUES (?, ?, ?, ?, ?, ?)',
      ['TRIAL', cleanMachine, ip, 'TRIAL', 'SUCCESS', '开始1小时免费试用']
    );

    const expSec = Math.floor(expireDate.getTime() / 1000);
    res.json({
      success: true,
      is_activated: false,
      is_trial_valid: true,
      license_type: 'TRIAL',
      expires_at: expSec,
      remaining_seconds: 3600,
      trialExpireAt: expireStr,
      trialExpireTimestamp: expireDate.getTime(),
      token: signLicenseToken(cleanMachine, expSec, 'TRIAL'),
      message: '已开启 1 小时免费试用体验'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '试用检测异常: ' + err.message });
  }
}

router.post(['/trial', '/trial/check'], deviceBlacklistGuard, async (req, res) => {
  const machineId = req.body.machineId || req.body.hwid;
  return handleTrialCheck(machineId, req, res);
});

router.post(['/heartbeat', '/ping'], async (req, res) => {
  const hwid = req.body.hwid || req.body.machineId || '';
  const clientVersion = req.body.client_version || req.body.version || '2.0 大师旗舰版';
  const osInfo = req.body.os_info || req.body.os || '';
  const cardKey = req.body.card_key || req.body.cardKey || null;
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '';

  if (!hwid || !hwid.trim()) {
    return res.status(400).json({ success: false, message: '设备机器码不能为空' });
  }

  const { blacklisted, reason } = await isDeviceBlacklisted(hwid);
  if (blacklisted) {
    return res.status(403).json({
      success: false,
      is_blacklisted: true,
      code: 'DEVICE_BLACKLISTED',
      message: `该设备已被系统封禁，拒绝提供服务（原因: ${reason}）`
    });
  }

  const { trackUserHeartbeat } = require('../userTracker');
  const result = await trackUserHeartbeat({
    hwid,
    clientVersion,
    osInfo,
    ipAddress: ip,
    cardKey
  });

  res.json({
    success: true,
    server_time: Date.now(),
    is_online: true,
    is_blacklisted: false,
    data: result
  });
});

module.exports = router;
