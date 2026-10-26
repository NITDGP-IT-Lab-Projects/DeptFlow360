const crypto = require('crypto');

let bcrypt = null;
try {
  bcrypt = require('bcryptjs');
} catch (e) {
  // bcryptjs not installed locally, will use crypto pbkdf2 fallback
}

let jwt = null;
try {
  jwt = require('jsonwebtoken');
} catch (e) {
  // jsonwebtoken not installed locally, will use crypto HMAC fallback
}

const JWT_SECRET = process.env.JWT_SECRET || 'deptflow-secure-academic-jwt-token-key-2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Hashes a plain-text password using bcrypt (or NIST PBKDF2 fallback)
 * @param {string} password 
 * @returns {Promise<string>|string}
 */
const hashPassword = async (password) => {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }

  if (bcrypt) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  // Cryptographic fallback using Node.js crypto PBKDF2
  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = 100000;
  const keylen = 64;
  const digest = 'sha512';
  const derivedKey = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest).toString('hex');
  return `pbkdf2$${iterations}$${salt}$${derivedKey}`;
};

/**
 * Compares candidate password against stored hash with timing-safe comparison
 * @param {string} candidatePassword 
 * @param {string} storedHash 
 * @returns {Promise<boolean>|boolean}
 */
const comparePassword = async (candidatePassword, storedHash) => {
  if (!candidatePassword || !storedHash) return false;

  // If hash is in standard bcrypt format ($2a$ or $2b$)
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
    if (bcrypt) {
      return await bcrypt.compare(candidatePassword, storedHash);
    }
  }

  // If hash is in PBKDF2 format
  if (storedHash.startsWith('pbkdf2$')) {
    const parts = storedHash.split('$');
    if (parts.length === 4) {
      const iterations = parseInt(parts[1], 10);
      const salt = parts[2];
      const originalKey = parts[3];
      const derivedKey = crypto.pbkdf2Sync(candidatePassword, salt, iterations, 64, 'sha512').toString('hex');
      
      const keyBuffer = Buffer.from(originalKey, 'hex');
      const derivedBuffer = Buffer.from(derivedKey, 'hex');
      if (keyBuffer.length === derivedBuffer.length) {
        return crypto.timingSafeEqual(keyBuffer, derivedBuffer);
      }
    }
  }

  return false;
};

/**
 * Base64URL encoder helper for fallback JWT
 */
const base64UrlEncode = (obj) => {
  return Buffer.from(JSON.stringify(obj))
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

const base64UrlDecode = (str) => {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return JSON.parse(Buffer.from(str, 'base64').toString('utf8'));
};

/**
 * Generates a signed JWT token
 * @param {object} payload 
 * @returns {string}
 */
const generateToken = (payload) => {
  if (jwt) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  // Fallback RFC 7519 HMAC-SHA256 JWT generator
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days
  const tokenPayload = { ...payload, exp, iat: Math.floor(Date.now() / 1000) };

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(tokenPayload);

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

/**
 * Verifies a JWT token signature and expiry
 * @param {string} token 
 * @returns {object} payload
 */
const verifyToken = (token) => {
  if (!token) throw new Error('No token provided');

  if (jwt) {
    return jwt.verify(token, JWT_SECRET);
  }

  // Fallback JWT verifier
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed token format');
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const sigBuffer = Buffer.from(signature);
  const expSigBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expSigBuffer.length || !crypto.timingSafeEqual(sigBuffer, expSigBuffer)) {
    throw new Error('Invalid token signature');
  }

  const payload = base64UrlDecode(encodedPayload);
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error('Token has expired');
  }

  return payload;
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken
};
