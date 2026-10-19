const crypto = require('crypto');

/**
 * Hashes a password using crypto.scryptSync with a random or provided salt.
 */
function hashPassword(password, salt = null) {
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex');
  }
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

/**
 * Verifies a password against a stored hash and salt.
 */
function verifyPassword(password, storedHash, salt) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
}

/**
 * Generates a simple opaque auth token.
 */
function generateToken(userId, role) {
  const payload = `${userId}:${role}:${Date.now()}`;
  const signature = crypto.createHmac('sha256', process.env.JWT_SECRET || 'bridge_of_love_secret_key_2026')
    .update(payload)
    .digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64');
}

/**
 * Verifies and decodes an auth token.
 */
function verifyToken(token) {
  if (!token) return null;
  try {
    const raw = Buffer.from(token, 'base64').toString('utf8');
    const parts = raw.split(':');
    if (parts.length !== 4) return null;
    const [userId, role, timestamp, signature] = parts;
    const payload = `${userId}:${role}:${timestamp}`;
    const expectedSig = crypto.createHmac('sha256', process.env.JWT_SECRET || 'bridge_of_love_secret_key_2026')
      .update(payload)
      .digest('hex');
    if (signature !== expectedSig) return null;
    return { userId: parseInt(userId), role, timestamp: parseInt(timestamp) };
  } catch (err) {
    return null;
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
};
