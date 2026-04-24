const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key_change_in_production';

function generateToken(userId) {
  return jwt.sign({ userId }, SECRET_KEY, { expiresIn: '7d' });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET_KEY);
}

module.exports = { generateToken, verifyToken };