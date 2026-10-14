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

    const [userCounts] = await pool.query(`
      SELECT 
        COUNT(*) as totalUsers,
        SUM(CASE WHEN last_heartbeat_at >= NOW() - INTERVAL 120 SECOND THEN 1 ELSE 0 END) as onlineUsers
      FROM t_app_user
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
        todayActivations: todayActivations[0].count || 0,
        totalUsers: userCounts[0]?.totalUsers || 0,
        onlineUsers: userCounts[0]?.onlineUsers || 0
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

router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '15', 10);
    const offset = (page - 1) * limit;
    const { status, keyword, licenseType } = req.query;

    let whereConditions = [];
    const params = [];

    if (keyword && keyword.trim()) {
      const kw = `%${keyword.trim()}%`;
      whereConditions.push('(hwid LIKE ? OR card_key LIKE ? OR remark LIKE ? OR ip_address LIKE ?)');
      params.push(kw, kw, kw, kw);
    }

    if (status === 'ONLINE') {
      whereConditions.push('last_heartbeat_at >= NOW() - INTERVAL 120 SECOND AND (is_blacklisted = 0 OR is_blacklisted IS NULL)');
    } else if (status === 'OFFLINE') {
      whereConditions.push('(last_heartbeat_at < NOW() - INTERVAL 120 SECOND OR last_heartbeat_at IS NULL) AND (is_blacklisted = 0 OR is_blacklisted IS NULL)');
    } else if (status === 'BLACKLISTED') {
      whereConditions.push('is_blacklisted = 1');
    }

    if (licenseType && licenseType !== 'ALL') {
      if (licenseType === 'ACTIVATED') {
        whereConditions.push('(card_key IS NOT NULL AND card_key != "")');
      } else if (licenseType === 'TRIAL') {
        whereConditions.push('license_type = "TRIAL"');
      } else if (licenseType === 'FREE') {
        whereConditions.push('(card_key IS NULL OR card_key = "") AND license_type != "TRIAL"');
      }
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const [totalRows] = await pool.query(`SELECT COUNT(*) as total FROM t_app_user ${whereClause}`, params);
    const [rows] = await pool.query(
      `SELECT * FROM t_app_user ${whereClause} ORDER BY last_heartbeat_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [statRows] = await pool.query(`
      SELECT 
        COUNT(*) as totalUsers,
        SUM(CASE WHEN last_heartbeat_at >= NOW() - INTERVAL 120 SECOND AND (is_blacklisted = 0 OR is_blacklisted IS NULL) THEN 1 ELSE 0 END) as onlineUsers,
        SUM(CASE WHEN last_heartbeat_at >= CURDATE() THEN 1 ELSE 0 END) as todayActiveUsers,
        SUM(CASE WHEN card_key IS NOT NULL AND card_key != '' THEN 1 ELSE 0 END) as activatedUsers,
        SUM(CASE WHEN (card_key IS NULL OR card_key = '') AND license_type != 'TRIAL' THEN 1 ELSE 0 END) as freeUsers,
        SUM(CASE WHEN is_blacklisted = 1 THEN 1 ELSE 0 END) as blacklistedUsers
      FROM t_app_user
    `);

    const stats = {
      totalUsers: statRows[0]?.totalUsers || 0,
      onlineUsers: statRows[0]?.onlineUsers || 0,
      todayActiveUsers: statRows[0]?.todayActiveUsers || 0,
      activatedUsers: statRows[0]?.activatedUsers || 0,
      freeUsers: statRows[0]?.freeUsers || 0,
      blacklistedUsers: statRows[0]?.blacklistedUsers || 0
    };

    const now = Date.now();
    const formattedUsers = rows.map(u => {
      const lastHb = u.last_heartbeat_at ? new Date(u.last_heartbeat_at).getTime() : 0;
      const isOnline = (now - lastHb) <= 120000 && !u.is_blacklisted;
      const diffSec = Math.floor((now - lastHb) / 1000);
      let lastActiveDesc = '';
      if (u.is_blacklisted) {
        lastActiveDesc = '已封禁';
      } else if (isOnline) {
        lastActiveDesc = '刚刚在线';
      } else if (diffSec < 3600) {
        lastActiveDesc = `${Math.max(1, Math.floor(diffSec / 60))} 分钟前`;
      } else if (diffSec < 86400) {
        lastActiveDesc = `${Math.floor(diffSec / 3600)} 小时前`;
      } else {
        lastActiveDesc = `${Math.floor(diffSec / 86400)} 天前`;
      }

      return {
        ...u,
        is_online: isOnline,
        is_blacklisted: Boolean(u.is_blacklisted),
        last_active_desc: lastActiveDesc
      };
    });

    res.json({
      success: true,
      total: totalRows[0]?.total || 0,
      page,
      limit,
      users: formattedUsers,
      stats
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取用户列表失败: ' + err.message });
  }
});

router.put('/users/:id/remark', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { remark } = req.body;
    await pool.query('UPDATE t_app_user SET remark = ? WHERE id = ?', [remark || '', id]);
    res.json({ success: true, message: '用户备注已更新' });
  } catch (err) {
    res.status(500).json({ success: false, message: '更新用户备注失败: ' + err.message });
  }
});

router.post('/users/:id/kick', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE t_app_user SET last_heartbeat_at = DATE_SUB(NOW(), INTERVAL 1 HOUR) WHERE id = ?', [id]);
    res.json({ success: true, message: '已强制该用户标记离线' });
  } catch (err) {
    res.status(500).json({ success: false, message: '操作失败: ' + err.message });
  }
});

router.delete('/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM t_app_user WHERE id = ?', [id]);
    res.json({ success: true, message: '设备用户记录已删除' });
  } catch (err) {
    res.status(500).json({ success: false, message: '删除用户失败: ' + err.message });
  }
});

router.post('/blacklist', authenticateAdmin, async (req, res) => {
  try {
    const { hwid, reason = '违规使用或恶意破解' } = req.body;
    if (!hwid || !hwid.trim()) {
      return res.status(400).json({ success: false, message: '设备机器码不能为空' });
    }
    const cleanHwid = hwid.trim();
    await pool.query(
      'INSERT INTO t_device_blacklist (hwid, reason, operator) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE reason = VALUES(reason), operator = VALUES(operator)',
      [cleanHwid, reason, req.admin?.username || 'admin']
    );
    await pool.query(
      'UPDATE t_app_user SET is_blacklisted = 1, blacklist_reason = ?, last_heartbeat_at = DATE_SUB(NOW(), INTERVAL 1 HOUR) WHERE hwid = ?',
      [reason, cleanHwid]
    );
    const { syncBlacklistCache } = require('../security');
    await syncBlacklistCache(true);
    res.json({ success: true, message: `已成功将设备 ${cleanHwid} 列入封禁黑名单` });
  } catch (err) {
    res.status(500).json({ success: false, message: '拉黑操作异常: ' + err.message });
  }
});

router.delete('/blacklist/:hwid', authenticateAdmin, async (req, res) => {
  try {
    const { hwid } = req.params;
    const cleanHwid = decodeURIComponent(hwid).trim();
    await pool.query('DELETE FROM t_device_blacklist WHERE hwid = ?', [cleanHwid]);
    await pool.query('UPDATE t_app_user SET is_blacklisted = 0, blacklist_reason = "" WHERE hwid = ?', [cleanHwid]);
    const { syncBlacklistCache } = require('../security');
    await syncBlacklistCache(true);
    res.json({ success: true, message: `已解除设备 ${cleanHwid} 的黑名单封禁` });
  } catch (err) {
    res.status(500).json({ success: false, message: '解除封禁失败: ' + err.message });
  }
});

router.get('/blacklist', authenticateAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM t_device_blacklist ORDER BY created_at DESC');
    res.json({ success: true, list: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
