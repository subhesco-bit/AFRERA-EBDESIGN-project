import api from './api';

/**
 * Farmer Service (API Client)
 * All farmer-related API calls
 */
class FarmerService {
  /**
   * Register new farmer
   * @param {object} farmerData
   * @returns {object} registration response
   */
  async registerFarmer(farmerData) {
    return api.post('/farmers/register', farmerData);
  }

  /**
   * Get farmer profile
   * @param {string} farmerId
   * @returns {object} farmer profile
   */
  async getFarmerProfile(farmerId) {
    return api.get(`/farmers/${farmerId}`);
  }

  /**
   * Update farmer profile
   * @param {string} farmerId
   * @param {object} profileData
   * @returns {object} updated profile
   */
  async updateFarmerProfile(farmerId, profileData) {
    return api.put(`/farmers/${farmerId}`, profileData);
  }

  /**
   * Get farmer's farms
   * @param {string} farmerId
   * @returns {object} farms list
   */
  async getFarmerFarms(farmerId) {
    return api.get(`/farmers/${farmerId}/farms`);
  }

  /**
   * Get farmer income summary
   * @param {string} farmerId
   * @returns {object} income data
   */
  async getFarmerIncome(farmerId) {
    return api.get(`/farmers/${farmerId}/income`);
  }

  /**
   * Get farmer transactions
   * @param {string} farmerId
   * @returns {object} transactions list
   */
  async getFarmerTransactions(farmerId) {
    return api.get(`/farmers/${farmerId}/transactions`);
  }
}

export default new FarmerService();