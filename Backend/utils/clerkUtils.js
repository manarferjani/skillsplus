/**
 * @swagger
 * components:
 *   schemas:
 *     ClerkResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The Clerk user ID
 *         email_addresses:
 *           type: array
 *           description: List of user email addresses
 *           items:
 *             type: object
 *         first_name:
 *           type: string
 *           description: User's first name
 *         last_name:
 *           type: string
 *           description: User's last name
 */

const axios = require('axios');

/**
 * Verify a Clerk user session token
 * @param {string} sessionToken - The Clerk session token
 * @returns {Promise<Object>} - The user data if valid
 * @throws {Error} - If token is invalid or verification fails
 */
const verifyClerkSession = async (sessionToken) => {
  if (!sessionToken) {
    throw new Error('No session token provided');
  }

  try {
    const response = await axios.get('https://api.clerk.dev/v1/me', {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status !== 200) {
      throw new Error('Invalid session token');
    }

    return response.data;
  } catch (error) {
    console.error('Clerk verification error:', error);
    throw new Error('Failed to verify Clerk session');
  }
};

/**
 * Get user info from Clerk using userId and secret key
 * @param {string} userId - The Clerk user ID
 * @returns {Promise<Object>} - The user data
 * @throws {Error} - If user ID is invalid or fetch fails
 */
const getClerkUser = async (userId) => {
  if (!userId) {
    throw new Error('No user ID provided');
  }

  try {
    const response = await axios.get(`https://api.clerk.dev/v1/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status !== 200) {
      throw new Error('Failed to get user data from Clerk');
    }

    return response.data;
  } catch (error) {
    console.error('Clerk user fetch error:', error);
    throw new Error('Failed to get user data from Clerk');
  }
};

module.exports = {
  verifyClerkSession,
  getClerkUser
}; 