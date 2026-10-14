const crypto = require('crypto');
const pool = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'TianYi_AI_Secret_Key_2026_Secure';
const failedAttempts = new Map();
const blacklistCache = new Map();
let lastCacheSync = 0;

async function syncBlacklistCache(force = false) {
  const now = Date.now();
  if (!force && now - lastCacheSync < 15000) return;
  try {
    const [rows] = await pool.query('SELECT hwid, reason FROM t_device_blacklist');
    blacklistCache.clear();
    for (const row of rows) {
      blacklistCache.set(row.hwid.trim().toUpperCase(), row.reason || '违规使用已被系统封禁');
    }
    lastCacheSync = now;
  } catch (err) {
  }
}

async function isDeviceBlacklisted(hwid) {
  if (!hwid || !hwid.trim()) return { blacklisted: false };
  await syncBlacklistCache();
  const cleanHwid = hwid.trim().toUpperCase();
  if (blacklistCache.has(cleanHwid)) {
    return { blacklisted: true, reason: blacklistCache.get(cleanHwid) };
  }
  return { blacklisted: false };
}

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.connection?.remoteAddress || '';
}

function activationRateLimiter(req, res, next) {
  const ip = getClientIp(req);
  const now = Date.now();
  const record = failedAttempts.get(ip) || { count: 0, resetAt: now + 600000 };

  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + 600000;
  }

  if (record.count >= 6) {
    return res.status(429).json({
      success: false,
      code: 'TOO_MANY_ATTEMPTS',
      message: '激活尝试失败次数过多，设备已被临时锁定，请 10 分钟后重试或联系客服'
    });
  }

  req.rateLimitKey = ip;
  next();
}

function recordFailedActivation(ip) {
  if (!ip) return;
  const now = Date.now();
  const record = failedAttempts.get(ip) || { count: 0, resetAt: now + 600000 };
  record.count += 1;
  failedAttempts.set(ip, record);
}

function clearFailedActivation(ip) {
  if (ip) failedAttempts.delete(ip);
}

async function deviceBlacklistGuard(req, res, next) {
  const hwid = req.body?.hwid || req.body?.machineId || req.query?.hwid;
  if (!hwid) return next();
  const { blacklisted, reason } = await isDeviceBlacklisted(hwid);
  if (blacklisted) {
    return res.status(403).json({
      success: false,
      code: 'DEVICE_BLACKLISTED',
      is_blacklisted: true,
      message: `该设备已被管理员加入黑名单封禁，拒绝提供服务（原因: ${reason}）`,
      reason
    });
  }
  next();
}

function signLicenseToken(hwid, expiresAt, licenseType) {
  const cleanHwid = hwid.trim();
  const payload = `${cleanHwid}:${expiresAt}:${licenseType}`;
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');
  return `${payload}:${sig}`;
}

function verifyLicenseToken(token, hwid) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split(':');
  if (parts.length !== 4) return false;
  const [tokenHwid, expiresAt, licenseType, sig] = parts;
  if (tokenHwid !== hwid.trim()) return false;
  const payload = `${tokenHwid}:${expiresAt}:${licenseType}`;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSig, 'hex'));
}

module.exports = {
  isDeviceBlacklisted,
  deviceBlacklistGuard,
  activationRateLimiter,
  recordFailedActivation,
  clearFailedActivation,
  signLicenseToken,
  verifyLicenseToken,
  syncBlacklistCache
};
