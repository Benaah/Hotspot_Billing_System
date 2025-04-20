import jwt from 'jsonwebtoken';

/**
 * Generate a JWT token
 * @param {Object} payload - The payload to encode in the token
 * @param {string} secret - The secret key to sign the token
 * @param {Object} [options] - Optional settings for the token
 * @returns {string} - The generated JWT token
 */
export function generateToken(payload, secret, options = {}) {
  return jwt.sign(payload, secret, options);
}