const express = require('express');
const router = express.Router();
const pool = require('../db');
const { isDeviceBlacklisted } = require('../security');

router.get('/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 as val');
    res.json({ status: 'ok', db: true, timestamp: Date.now() });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

router.get('/info', async (req, res) => {
  try {
    const [configRows] = await pool.query('SELECT config_key, config_value FROM t_system_config');
    const configMap = {};
    for (const r of configRows) {
      configMap[r.config_key] = r.config_value;
    }

    const [packages] = await pool.query(
      'SELECT id, name, price, duration_days, description, badge, sort_order FROM t_package WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'
    );

    res.json({
      success: true,
      contacts: {
        wechat: configMap.contact_wechat || '',
        qq: configMap.contact_qq || '',
        telegram: configMap.contact_telegram || '',
        notice: configMap.notice_text || '',
        trialHours: parseInt(configMap.trial_duration_hours || '1', 10)
      },
      packages
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取公开配置失败: ' + err.message });
  }
});

const feedbackRateMap = new Map();

router.post('/feedback', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '';
    const now = Date.now();
    const rateInfo = feedbackRateMap.get(ip) || { count: 0, resetAt: now + 300000 };
    if (now > rateInfo.resetAt) {
      rateInfo.count = 0;
      rateInfo.resetAt = now + 300000;
    }
    if (rateInfo.count >= 3) {
      return res.status(429).json({ success: false, message: '提交反馈过于频繁，请稍候再试' });
    }

    const { content, contact, image, hwid, version } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: '留言反馈内容不能为空' });
    }
    if (image && image.length > 3 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: '反馈截图文件体积过大，请压缩至 2MB 以内' });
    }

    rateInfo.count++;
    feedbackRateMap.set(ip, rateInfo);

    const [result] = await pool.query(
      'INSERT INTO t_feedback (hwid, client_version, contact, content, image_data, status) VALUES (?, ?, ?, ?, ?, ?)',
      [hwid || null, version || '2.0.0', contact || '', content.trim(), image || null, 'PENDING']
    );
    res.json({
      success: true,
      id: result.insertId,
      message: '反馈提交成功，技术支持团队将尽快跟进处理！'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '提交反馈异常: ' + err.message });
  }
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
      message: `该设备已被管理员加入黑名单封禁，严禁使用（原因: ${reason}）`
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

router.get('/version/check', async (req, res) => {
  try {
    const clientBuild = parseInt(req.query.build || '0', 10);
    const clientVersion = req.query.version || '1.0.0';
    const channel = req.query.channel || 'stable';

    const [rows] = await pool.query(
      'SELECT id, version, build_number, channel, title, changelog, download_url, file_sha256, file_size, force_update, is_active FROM t_app_version WHERE is_active = 1 AND channel = ? ORDER BY build_number DESC LIMIT 1',
      [channel]
    );

    if (rows.length === 0) {
      return res.json({
        success: true,
        has_update: false,
        current_version: clientVersion,
        latest_version: clientVersion
      });
    }

    const latest = rows[0];
    const hasUpdate = latest.build_number > clientBuild;

    res.json({
      success: true,
      has_update: hasUpdate,
      current_version: clientVersion,
      latest_version: latest.version,
      build_number: latest.build_number,
      title: latest.title,
      changelog: latest.changelog,
      download_url: latest.download_url,
      file_sha256: latest.file_sha256,
      file_size: latest.file_size,
      force_update: Boolean(latest.force_update)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '版本检查异常: ' + err.message });
  }
});

router.post('/version/stat', async (req, res) => {
  try {
    const versionId = req.body.version_id;
    if (versionId) {
      await pool.query('UPDATE t_app_version SET download_count = download_count + 1 WHERE id = ?', [versionId]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
