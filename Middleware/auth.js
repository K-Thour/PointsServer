const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_jwt_secret'; // Move to .env

module.exports = function (req, res, next) {
  const token = req.header('Authorization')?.split(' ')[1]; // Bearer <token>

  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.userId; // Store userId for later use
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};