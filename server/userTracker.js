const pool = require('./db');

async function trackUserHeartbeat({ hwid, clientVersion, osInfo, ipAddress, cardKey }) {
  if (!hwid || !hwid.trim()) return null;
  const cleanHwid = hwid.trim();
  const version = clientVersion || '2.0 大师旗舰版';
  const os = osInfo || '';
  const ip = ipAddress || '';

  let licenseType = 'NONE';
  let licenseExpireAt = null;
  let activeCardKey = cardKey ? cardKey.trim().toUpperCase() : null;

  try {
    const [blRows] = await pool.query('SELECT reason FROM t_device_blacklist WHERE hwid = ?', [cleanHwid]);
    const isBl = blRows.length > 0 ? 1 : 0;
    const blReason = blRows.length > 0 ? blRows[0].reason : '';

    const [cards] = await pool.query(
      'SELECT card_key, package_name, expire_at, status FROM t_card_key WHERE machine_id = ? AND status = "ACTIVATED"',
      [cleanHwid]
    );

    const now = new Date();
    if (cards.length > 0) {
      const card = cards[0];
      const exp = new Date(card.expire_at);
      if (exp > now) {
        licenseType = card.package_name || 'ACTIVATED';
        licenseExpireAt = card.expire_at;
        activeCardKey = card.card_key;
      } else {
        licenseType = 'EXPIRED';
        licenseExpireAt = card.expire_at;
        activeCardKey = card.card_key;
      }
    } else {
      const [trials] = await pool.query(
        'SELECT expire_time FROM t_trial_record WHERE machine_id = ?',
        [cleanHwid]
      );
      if (trials.length > 0) {
        const trial = trials[0];
        const exp = new Date(trial.expire_time);
        if (exp > now) {
          licenseType = 'TRIAL';
          licenseExpireAt = trial.expire_time;
        } else {
          licenseType = 'TRIAL_EXPIRED';
          licenseExpireAt = trial.expire_time;
        }
      } else {
        licenseType = 'FREE_USER';
      }
    }

    await pool.query(`
      INSERT INTO t_app_user 
        (hwid, client_version, os_info, ip_address, card_key, license_type, license_expire_at, is_blacklisted, blacklist_reason, first_seen_at, last_heartbeat_at, heartbeat_count)
      VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 1)
      ON DUPLICATE KEY UPDATE 
        last_heartbeat_at = NOW(),
        heartbeat_count = heartbeat_count + 1,
        client_version = VALUES(client_version),
        os_info = VALUES(os_info),
        ip_address = VALUES(ip_address),
        card_key = COALESCE(VALUES(card_key), card_key),
        license_type = VALUES(license_type),
        license_expire_at = VALUES(license_expire_at),
        is_blacklisted = VALUES(is_blacklisted),
        blacklist_reason = VALUES(blacklist_reason)
    `, [cleanHwid, version, os, ip, activeCardKey, licenseType, licenseExpireAt, isBl, blReason]);

    return {
      hwid: cleanHwid,
      licenseType,
      licenseExpireAt,
      isOnline: true,
      isBlacklisted: isBl === 1
    };
  } catch (err) {
    console.error('trackUserHeartbeat error:', err.message);
    return null;
  }
}

module.exports = { trackUserHeartbeat };
