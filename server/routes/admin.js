const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { authenticateAdmin, JWT_SECRET } = require('../middleware/auth');

function sha256Hash(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

function generateRandomCardCode(prefix = 'TY') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segment = (len) => {
    let s = '';
    for (let i = 0; i < len; i++) {
      s += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return s;
  };
  return `${prefix}-${segment(4)}-${segment(4)}-${segment(4)}`;
}

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '请输入管理员账号与密码' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM t_admin WHERE username = ?', [username.trim()]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: '账号或密码错误' });
    }

    const admin = rows[0];
    const inputHash = sha256Hash(password.trim());
    if (admin.password_hash !== inputHash) {
      return res.status(401).json({ success: false, message: '账号或密码错误' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, nickname: admin.nickname },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: '登录成功',
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        nickname: admin.nickname
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: '登录验证异常: ' + err.message });
  }
});

router.get('/me', authenticateAdmin, (req, res) => {
  res.json({ success: true, admin: req.admin });
});

router.get('/dashboard', authenticateAdmin, async (req, res) => {
  try {
    const [cardCounts] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'UNUSED' THEN 1 ELSE 0 END) as unused,
        SUM(CASE WHEN status = 'ACTIVATED' THEN 1 ELSE 0 END) as activated,
        SUM(CASE WHEN status = 'EXPIRED' THEN 1 ELSE 0 END) as expired,
        SUM(CASE WHEN status = 'DISABLED' THEN 1 ELSE 0 END) as disabled
      FROM t_card_key
    `);

    const [packageCounts] = await pool.query('SELECT COUNT(*) as count FROM t_package WHERE is_active = 1');
    const [trialCounts] = await pool.query('SELECT COUNT(*) as count FROM t_trial_record');

    const [todayActivations] = await pool.query(`
      SELECT COUNT(*) as count FROM t_activation_log 
      WHERE action = 'ACTIVATE' AND status = 'SUCCESS' 
      AND created_at >= CURDATE()
    `);

    const [recentLogs] = await pool.query(`
      SELECT id, card_key, machine_id, action, status, message, created_at 
      FROM t_activation_log 
      ORDER BY id DESC LIMIT 10
    `);

    res.json({
      success: true,
      stats: {
        totalCards: cardCounts[0].total || 0,
        unusedCards: cardCounts[0].unused || 0,
        activatedCards: cardCounts[0].activated || 0,
        expiredCards: cardCounts[0].expired || 0,
        disabledCards: cardCounts[0].disabled || 0,
        activePackages: packageCounts[0].count || 0,
        totalTrials: trialCounts[0].count || 0,
        todayActivations: todayActivations[0].count || 0
      },
      recentLogs
    });

  } catch (err) {
    res.status(500).json({ success: false, message: '获取仪表盘统计失败: ' + err.message });
  }
});

router.get('/cards', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = (page - 1) * limit;

    const { status, keyword, packageId } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status && status !== 'ALL') {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    if (packageId) {
      whereClause += ' AND package_id = ?';
      params.push(packageId);
    }
    if (keyword && keyword.trim()) {
      whereClause += ' AND (card_key LIKE ? OR machine_id LIKE ? OR note LIKE ?)';
      const k = `%${keyword.trim()}%`;
      params.push(k, k, k);
    }

    const [totalRows] = await pool.query(`SELECT COUNT(*) as total FROM t_card_key ${whereClause}`, params);
    const total = totalRows[0].total;

    const [rows] = await pool.query(
      `SELECT * FROM t_card_key ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      total,
      page,
      limit,
      cards: rows
    });

  } catch (err) {
    res.status(500).json({ success: false, message: '查询卡密列表失败: ' + err.message });
  }
});

router.post('/cards/generate', authenticateAdmin, async (req, res) => {
  const { count = 1, packageId, customDays, note = '', prefix = 'TY' } = req.body;
  const generateCount = Math.min(Math.max(1, parseInt(count, 10)), 200);

  try {
    let durationDays = 30;
    let packageName = '自定义套餐';

    if (packageId) {
      const [pkgs] = await pool.query('SELECT * FROM t_package WHERE id = ?', [packageId]);
      if (pkgs.length > 0) {
        durationDays = pkgs[0].duration_days;
        packageName = pkgs[0].name;
      }
    } else if (customDays) {
      durationDays = parseInt(customDays, 10);
      packageName = `${durationDays}天卡`;
    }

    const createdCards = [];
    for (let i = 0; i < generateCount; i++) {
      let key = generateRandomCardCode(prefix);
      let attempts = 0;
      while (attempts < 5) {
        try {
          await pool.query(
            'INSERT INTO t_card_key (card_key, package_id, package_name, duration_days, note) VALUES (?, ?, ?, ?, ?)',
            [key, packageId || null, packageName, durationDays, note]
          );
          createdCards.push(key);
          break;
        } catch (e) {
          key = generateRandomCardCode(prefix);
          attempts++;
        }
      }
    }

    res.json({
      success: true,
      message: `成功生成 ${createdCards.length} 张卡密`,
      count: createdCards.length,
      cards: createdCards
    });

  } catch (err) {
    res.status(500).json({ success: false, message: '生成卡密失败: ' + err.message });
  }
});

router.post('/cards/:id/unbind', authenticateAdmin, async (req, res) => {
  const cardId = req.params.id;
  try {
    const [rows] = await pool.query('SELECT * FROM t_card_key WHERE id = ?', [cardId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '卡密不存在' });
    }

    await pool.query('UPDATE t_card_key SET machine_id = NULL WHERE id = ?', [cardId]);

    await pool.query(
      'INSERT INTO t_activation_log (card_key, machine_id, action, status, message) VALUES (?, ?, ?, ?, ?)',
      [rows[0].card_key, rows[0].machine_id || '', 'UNBIND', 'SUCCESS', '管理员后台手动解绑设备']
    );

    res.json({ success: true, message: '设备机器码已成功解绑' });

  } catch (err) {
    res.status(500).json({ success: false, message: '解绑失败: ' + err.message });
  }
});

router.post('/cards/:id/extend', authenticateAdmin, async (req, res) => {
  const cardId = req.params.id;
  const { days = 30 } = req.body;
  const extendDays = parseInt(days, 10);

  try {
    const [rows] = await pool.query('SELECT * FROM t_card_key WHERE id = ?', [cardId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '卡密不存在' });
    }

    const card = rows[0];
    let baseTime = card.expire_at ? new Date(card.expire_at) : new Date();
    if (baseTime < new Date()) {
      baseTime = new Date();
    }

    const newExpire = new Date(baseTime.getTime() + extendDays * 86400000);
    const pad = n => String(n).padStart(2, '0');
    const newExpireStr = `${newExpire.getFullYear()}-${pad(newExpire.getMonth() + 1)}-${pad(newExpire.getDate())} ${pad(newExpire.getHours())}:${pad(newExpire.getMinutes())}:${pad(newExpire.getSeconds())}`;

    await pool.query(
      'UPDATE t_card_key SET expire_at = ?, status = "ACTIVATED", duration_days = duration_days + ? WHERE id = ?',
      [newExpireStr, extendDays, cardId]
    );

    res.json({ success: true, message: `成功延长 ${extendDays} 天，新到期时间: ${newExpireStr}`, newExpireAt: newExpireStr });

  } catch (err) {
    res.status(500).json({ success: false, message: '延长时长失败: ' + err.message });
  }
});

router.delete('/cards/:id', authenticateAdmin, async (req, res) => {
  const cardId = req.params.id;
  try {
    await pool.query('DELETE FROM t_card_key WHERE id = ?', [cardId]);
    res.json({ success: true, message: '卡密已删除' });
  } catch (err) {
    res.status(500).json({ success: false, message: '删除失败: ' + err.message });
  }
});

router.get('/packages', authenticateAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM t_package ORDER BY sort_order ASC, id ASC');
    res.json({ success: true, packages: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/packages', authenticateAdmin, async (req, res) => {
  const { name, price, duration_days, description = '', badge = '', sort_order = 0, is_active = 1 } = req.body;
  if (!name || !price || !duration_days) {
    return res.status(400).json({ success: false, message: '请完整填写套餐名称、价格和有效天数' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO t_package (name, price, duration_days, description, badge, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name.trim(), price.trim(), parseInt(duration_days, 10), description.trim(), badge.trim(), parseInt(sort_order, 10), is_active ? 1 : 0]
    );
    res.json({ success: true, message: '套餐创建成功', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: '创建套餐失败: ' + err.message });
  }
});

router.put('/packages/:id', authenticateAdmin, async (req, res) => {
  const pkgId = req.params.id;
  const { name, price, duration_days, description, badge, sort_order, is_active } = req.body;

  try {
    await pool.query(
      'UPDATE t_package SET name = ?, price = ?, duration_days = ?, description = ?, badge = ?, sort_order = ?, is_active = ? WHERE id = ?',
      [name, price, parseInt(duration_days, 10), description, badge, parseInt(sort_order, 10), is_active ? 1 : 0, pkgId]
    );
    res.json({ success: true, message: '套餐已更新' });
  } catch (err) {
    res.status(500).json({ success: false, message: '更新套餐失败: ' + err.message });
  }
});

router.delete('/packages/:id', authenticateAdmin, async (req, res) => {
  const pkgId = req.params.id;
  try {
    await pool.query('DELETE FROM t_package WHERE id = ?', [pkgId]);
    res.json({ success: true, message: '套餐已删除' });
  } catch (err) {
    res.status(500).json({ success: false, message: '删除套餐失败: ' + err.message });
  }
});

router.get('/config', authenticateAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT config_key, config_value, description FROM t_system_config');
    const configs = {};
    for (const r of rows) {
      configs[r.config_key] = r.config_value;
    }
    res.json({ success: true, configs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/config', authenticateAdmin, async (req, res) => {
  const configs = req.body;
  try {
    for (const [key, val] of Object.entries(configs)) {
      await pool.query(
        'INSERT INTO t_system_config (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)',
        [key, String(val)]
      );
    }
    res.json({ success: true, message: '系统客服与配置已成功保存' });
  } catch (err) {
    res.status(500).json({ success: false, message: '保存配置失败: ' + err.message });
  }
});

router.get('/logs', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = (page - 1) * limit;

    const [totalRows] = await pool.query('SELECT COUNT(*) as total FROM t_activation_log');
    const [rows] = await pool.query('SELECT * FROM t_activation_log ORDER BY id DESC LIMIT ? OFFSET ?', [limit, offset]);

    res.json({
      success: true,
      total: totalRows[0].total,
      page,
      limit,
      logs: rows
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/feedbacks', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const status = req.query.status || 'ALL';
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params = [];
    if (status && status !== 'ALL') {
      whereClause = 'WHERE status = ?';
      params.push(status);
    }

    const [totalRows] = await pool.query(`SELECT COUNT(*) as total FROM t_feedback ${whereClause}`, params);
    const [rows] = await pool.query(
      `SELECT * FROM t_feedback ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      total: totalRows[0].total,
      page,
      limit,
      feedbacks: rows
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取反馈列表失败: ' + err.message });
  }
});

router.put('/feedbacks/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await pool.query('UPDATE t_feedback SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true, message: '反馈状态已更新' });
  } catch (err) {
    res.status(500).json({ success: false, message: '更新反馈状态失败: ' + err.message });
  }
});

router.delete('/feedbacks/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM t_feedback WHERE id = ?', [id]);
    res.json({ success: true, message: '反馈记录已删除' });
  } catch (err) {
    res.status(500).json({ success: false, message: '删除反馈失败: ' + err.message });
  }
});

module.exports = router;
