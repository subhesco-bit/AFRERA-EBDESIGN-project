import api from './api';

/**
 * Auth Service (API Client)
 * All authentication-related API calls
 */
class AuthService {
  /**
   * User login
   * @param {object} credentials {email, password}
   * @returns {object} login response
   */
  async login(credentials) {
    return api.post('/auth/login', credentials);
  }

  /**
   * User registration
   * @param {object} userData
   * @returns {object} registration response
   */
  async register(userData) {
    return api.post('/auth/register', userData);
  }

  /**
   * User logout
   * @returns {object} logout response
   */
  async logout() {
    return api.post('/auth/logout');
  }

  /**
   * Refresh token
   * @param {string} refreshToken
   * @returns {object} token response
   */
  async refreshToken(refreshToken) {
    return api.post('/auth/refresh-token', { refreshToken });
  }

  /**
   * Get current user profile
   * @returns {object} user profile
   */
  async getProfile() {
    return api.get('/users/profile');
  }

  /**
   * Update user profile
   * @param {object} profileData
   * @returns {object} updated profile
   */
  async updateProfile(profileData) {
    return api.put('/users/profile', profileData);
  }
}

export default new AuthService();