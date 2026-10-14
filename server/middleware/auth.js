const jwt = require('jsonwebtoken');

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'TianYi_Admin_Master_Key_9988_SuperSecure!';

function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '未提供有效的身份凭据' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    try {
      const decodedOld = jwt.verify(token, process.env.JWT_SECRET || 'TianYi_AI_Secret_Key_2026_Secure');
      req.admin = decodedOld;
      next();
    } catch (e2) {
      return res.status(401).json({ success: false, message: '登录状态已失效，请重新登录' });
    }
  }
}

module.exports = {
  authenticateAdmin,
  ADMIN_JWT_SECRET,
  JWT_SECRET: ADMIN_JWT_SECRET
};
