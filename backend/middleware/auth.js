const { verifyToken } = require('../utils/token');
const db = require('../db');

module.exports = async function (req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    
    const sql = `SELECT token FROM users WHERE id = ?`;
    db.query(sql, [decoded.userId], (err, results) => {
      if (err || results.length === 0) {
        return res.status(401).json({ message: 'User not found' });
      }
      if (results[0].token !== token) {
        return res.status(401).json({ message: 'Tài khoản đang được đăng nhập ở nơi khác' });
      }
      next();
    });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};