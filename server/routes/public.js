const express = require('express');
const router = express.Router();
const pool = require('../db');

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

router.post('/feedback', async (req, res) => {
  try {
    const { content, contact, image, hwid, version } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: '留言反馈内容不能为空' });
    }
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
  const ip = req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress || '';

  if (!hwid || !hwid.trim()) {
    return res.status(400).json({ success: false, message: '设备机器码不能为空' });
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
    data: result
  });
});

module.exports = router;
