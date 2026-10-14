const crypto = require('crypto');
const pool = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'TianYi_AI_Secret_Key_2026_Secure';
const failedAttempts = new Map();
const blacklistCache = new Map();
let lastCacheSync = 0;

const RSA_PRIVATE_KEY = process.env.LICENSE_RSA_PRIVATE_KEY || `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDkiqgb8+3v6sol
6xK78+Ss+cKnniopo+daDMB5DTU5CXFDPvFiiwGjLF0taPvckOjrq2B4saar0oau
HcqhFJd7doUOeZmPXJ1eyugtZ70tcjk6Zzzmtvri9AEf6qJ7U2VIyQKzQdLf8tAM
HA6v9dFQNYgxDEdFLRpFPjKZAWSYsMN9Y4vcH84ei7RSYguTwS02Q2ceq4W2hfeY
AZKjg20gfD12CkuZNxJZhPK93s0HG/YCOKwKKjWFUK6GFC3zrFd/uVo7ZR4VrqbZ
0R7F3WBzr7OyRymjk0AzRlzpjYDZeo29m/cTk6DROO+uxvO533WcGSx4hojRNUlN
r3NxFQeZAgMBAAECggEAN333bbof9xZSeTyH8v04dEu82QhNgojavwHDpmDvoGbL
iqF46Q2Jmz5FbaZFKXxCIh8dsJCqQKRAsXxoXA5s7byMeERMZgP97itkjsnWpHdM
sAKrRfX+GydWMpK9WyaXvEGalz4PXvNNUvNpGY6dgVVOOWKa15ApBdEhZgdxjqU/
a3F4xDYb9OwaPvCyok9CKPNqeXcB9Jux5ZLGBn+bzcw6ZnbzRKLzgxZejKX3If/S
xrM5QgTPxy/ipLjs3kBssFCPSvOGWwY7F7vaTnvk+CnrlZ6XMepq3BWTp4MMUiw2
5F0yIGNCgEFZ4BtSEcBXeuJu8z7LYWddn6dkl1uSxQKBgQD9VnKAP6puPBBBzMMw
t4EJZUqaNUJbbVh/c7hotfP0pJb5r5EecXPpD5r5LMBBOrQmbK3Q33PWW2b9w3d3
T+Dt/7e0kQ2A+tHP62LzgfDqq2WCbMa/OeHAghiUJBEhkRmASvS/klqmYVeeJ2bb
dGhSwfF5haZ/OSORGcGHsv8l2wKBgQDm8YAwNxwBg9rPqvHCsmSFsGrrC6c9b6X9
EXgAOZBFKIu8GTShx7NULWSNGtX+vnl2YwL7YttHmHitvfhGGubLQHDZnqZK57or
T40jAc0IsTjezGRtK/jRdOh7zrmOOPFO0WxQC3z7WIHmzBDUOF0SGfm5QpvZQ5kU
QUw84CwUmwKBgQDTuJKa0hpqZDIl+63JIiNqKcgOVqJtbFYAtkKQ6DfI5mDyrSK3
8ZMwXQVkZ10JZrk2P6+IF6dkpyDMxbYq9YwC+6qY8nz5pSUCAjPBVIB2buW3+Zak
LAiabV+DNx1GE1DfokUncXXnBQVHvKA+meux9joMGIFMZAFwe7j84sBP7wKBgF2j
vFNQdRWULguYB5DnHmUqpB+LyRLbC1WyWJLWxE2WZBovqiySuX6/LQ8du3kgKEW9
Xb8qVTkRdJUV+u4KCFyPU3KZplmm3dCj39k66LTGjwWfoHS3qJrdKUrSBmDJa+aG
ecF29wU+3OUFBynVdL9bMutQO7r7cr1IwK3KQ3VTAoGBAINtVOZOPr3zk0P1EYA4
ynL3Tml62/YLQJxjghlpfre93MfIRtiyFXecfX0bhntiPDwHhFFyALUQkRtfSTq0
NS1rfTJ8h3r4WbEzlQU1J2PQxHUERvGsjXFxin9uNU8Qq4CZl8qLJh0DNipqjHrt
CgeoGpQt24wmHjoxlSIPPDBL
-----END PRIVATE KEY-----`;

const RSA_PUBLIC_KEY = process.env.LICENSE_RSA_PUBLIC_KEY || `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA5IqoG/Pt7+rKJesSu/Pk
rPnCp54qKaPnWgzAeQ01OQlxQz7xYosBoyxdLWj73JDo66tgeLGmq9KGrh3KoRSX
e3aFDnmZj1ydXsroLWe9LXI5Omc85rb64vQBH+qie1NlSMkCs0HS3/LQDBwOr/XR
UDWIMQxHRS0aRT4ymQFkmLDDfWOL3B/OHou0UmILk8EtNkNnHquFtoX3mAGSo4Nt
IHw9dgpLmTcSWYTyvd7NBxv2AjisCio1hVCuhhQt86xXf7laO2UeFa6m2dEexd1g
c6+zskcpo5NAM0Zc6Y2A2XqNvZv3E5Og0Tjvrsbzud91nBkseIaI0TVJTa9zcRUH
mQIDAQAB
-----END PUBLIC KEY-----`;

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
  const signer = crypto.createSign('SHA256');
  signer.update(payload);
  signer.end();
  const sig = signer.sign(RSA_PRIVATE_KEY, 'base64');
  return `${payload}:${sig}`;
}

function verifyLicenseToken(token, hwid) {
  if (!token || typeof token !== 'string') return false;
  const lastColon = token.lastIndexOf(':');
  if (lastColon <= 0) return false;
  const payload = token.substring(0, lastColon);
  const sig = token.substring(lastColon + 1);
  const parts = payload.split(':');
  if (parts.length !== 3) return false;
  const [tokenHwid] = parts;
  if (tokenHwid !== hwid.trim()) return false;
  try {
    const verifier = crypto.createVerify('SHA256');
    verifier.update(payload);
    verifier.end();
    return verifier.verify(RSA_PUBLIC_KEY, sig, 'base64');
  } catch (err) {
    return false;
  }
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
