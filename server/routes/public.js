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

module.exports = router;
