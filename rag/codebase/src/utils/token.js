const jwt = require('jsonwebtoken');

const signToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'fallback-super-secret-key-12345',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    }
  );
};

module.exports = {
  signToken,
};
