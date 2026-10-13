const express = require('express');
const router = express.Router();
const pool = require('../db');

function formatDateTime(d) {
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

router.post('/activate', async (req, res) => {
  const { cardKey, machineId } = req.body;
  const ip = req.ip || req.connection.remoteAddress || '';

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
        return res.status(409).json({ success: false, message: '该卡密已在其他设备绑定激活，如需换绑请联系客服解绑' });
      }

      const expireDate = new Date(card.expire_at);
      if (expireDate <= now) {
        await pool.query('UPDATE t_card_key SET status = "EXPIRED" WHERE id = ?', [card.id]);
        return res.status(410).json({ success: false, message: '该卡密已过有效期，请联系客服续期购买' });
      }

      await pool.query(
        'INSERT INTO t_activation_log (card_key, machine_id, ip, action, status, message) VALUES (?, ?, ?, ?, ?, ?)',
        [cleanKey, cleanMachine, ip, 'ACTIVATE', 'SUCCESS', '本设备恢复激活状态']
      );

      return res.json({
        success: true,
        message: '激活恢复成功',
        cardKey: card.card_key,
        packageName: card.package_name,
        expireAt: card.expire_at,
        expireTimestamp: expireDate.getTime()
      });
    }

    if (card.status === 'EXPIRED') {
      return res.status(410).json({ success: false, message: '该卡密已失效过期' });
    }

    const expireDate = new Date(now.getTime() + card.duration_days * 24 * 60 * 60 * 1000);
    const expireStr = formatDateTime(expireDate);
    const nowStr = formatDateTime(now);

    await pool.query(
      'UPDATE t_card_key SET status = "ACTIVATED", machine_id = ?, activated_at = ?, expire_at = ? WHERE id = ?',
      [cleanMachine, nowStr, expireStr, card.id]
    );

    await pool.query(
      'INSERT INTO t_activation_log (card_key, machine_id, ip, action, status, message) VALUES (?, ?, ?, ?, ?, ?)',
      [cleanKey, cleanMachine, ip, 'ACTIVATE', 'SUCCESS', `激活成功，有效期 ${card.duration_days} 天`]
    );

    res.json({
      success: true,
      message: '恭喜！卡密授权激活成功',
      cardKey: card.card_key,
      packageName: card.package_name,
      durationDays: card.duration_days,
      expireAt: expireStr,
      expireTimestamp: expireDate.getTime()
    });

  } catch (err) {
    res.status(500).json({ success: false, message: '激活处理异常: ' + err.message });
  }
});

router.post('/verify', async (req, res) => {
  const { cardKey, machineId } = req.body;
  if (!cardKey || !machineId) {
    return res.status(400).json({ success: false, isValid: false, message: '缺少参数' });
  }

  const cleanKey = cardKey.trim().toUpperCase();
  const cleanMachine = machineId.trim();

  try {
    const [cards] = await pool.query('SELECT * FROM t_card_key WHERE card_key = ?', [cleanKey]);
    if (cards.length === 0) {
      return res.json({ success: false, isValid: false, message: '卡密不存在' });
    }

    const card = cards[0];
    if (card.status !== 'ACTIVATED') {
      return res.json({ success: false, isValid: false, message: '卡密未激活或已失效' });
    }

    if (card.machine_id !== cleanMachine) {
      return res.json({ success: false, isValid: false, message: '设备绑定不匹配' });
    }

    const now = new Date();
    const expireDate = new Date(card.expire_at);
    if (expireDate <= now) {
      await pool.query('UPDATE t_card_key SET status = "EXPIRED" WHERE id = ?', [card.id]);
      return res.json({ success: false, isValid: false, message: '授权已到期' });
    }

    const remainingMs = expireDate.getTime() - now.getTime();
    const remainingHours = (remainingMs / (1000 * 60 * 60)).toFixed(1);

    res.json({
      success: true,
      isValid: true,
      cardKey: card.card_key,
      packageName: card.package_name,
      expireAt: card.expire_at,
      expireTimestamp: expireDate.getTime(),
      remainingHours
    });

  } catch (err) {
    res.status(500).json({ success: false, isValid: false, message: err.message });
  }
});

router.post('/trial', async (req, res) => {
  const { machineId } = req.body;
  const ip = req.ip || req.connection.remoteAddress || '';

  if (!machineId || !machineId.trim()) {
    return res.status(400).json({ success: false, message: '未获取到设备机器码' });
  }

  const cleanMachine = machineId.trim();

  try {
    const [trials] = await pool.query('SELECT * FROM t_trial_record WHERE machine_id = ?', [cleanMachine]);
    const now = new Date();

    if (trials.length > 0) {
      const record = trials[0];
      const expireDate = new Date(record.expire_time);
      if (expireDate > now) {
        const remainingMinutes = Math.max(1, Math.round((expireDate.getTime() - now.getTime()) / (1000 * 60)));
        return res.json({
          success: true,
          isTrialActive: true,
          trialExpireAt: record.expire_time,
          trialExpireTimestamp: expireDate.getTime(),
          remainingMinutes,
          message: `正在试用中，剩余 ${remainingMinutes} 分钟`
        });
      } else {
        return res.json({
          success: false,
          isTrialActive: false,
          code: 'TRIAL_EXPIRED',
          message: '您的 1 小时免费试用额度已用完，请联系客服购买卡密以继续使用'
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

    res.json({
      success: true,
      isTrialActive: true,
      trialExpireAt: expireStr,
      trialExpireTimestamp: expireDate.getTime(),
      remainingMinutes: 60,
      message: '已为您开启 1 小时全功能试用体验'
    });

  } catch (err) {
    res.status(500).json({ success: false, message: '试用服务异常: ' + err.message });
  }
});

module.exports = router;
