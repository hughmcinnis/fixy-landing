const jwt = require('jsonwebtoken');

const SECRET = () => process.env.JWT_SECRET || 'fixy-pro-dev-secret';

function signToken(proId) {
  return jwt.sign({ proId }, SECRET(), { expiresIn: '30d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET());
  } catch {
    return null;
  }
}

function getTokenFromHeader(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

module.exports = { signToken, verifyToken, getTokenFromHeader };
