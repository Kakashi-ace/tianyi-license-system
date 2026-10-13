const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'TianYi_AI_Secret_Key_2026_Secure';

function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '未提供有效的身份凭据' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: '登录状态已失效，请重新登录' });
  }
}

module.exports = {
  authenticateAdmin,
  JWT_SECRET
};
