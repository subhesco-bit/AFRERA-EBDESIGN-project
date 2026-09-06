import api from './api';

/**
 * Marketplace Service (API Client)
 * All marketplace-related API calls
 */
class MarketplaceService {
  /**
   * Get marketplace listings
   * @param {object} filters
   * @returns {object} listings
   */
  async getListings(filters = {}) {
    return api.get('/marketplace/listings', { params: filters });
  }

  /**
   * Get listing details
   * @param {string} listingId
   * @returns {object} listing details
   */
  async getListing(listingId) {
    return api.get(`/marketplace/listings/${listingId}`);
  }

  /**
   * Create listing
   * @param {object} listingData
   * @returns {object} created listing
   */
  async createListing(listingData) {
    return api.post('/marketplace/listings', listingData);
  }

  /**
   * Update listing
   * @param {string} listingId
   * @param {object} listingData
   * @returns {object} updated listing
   */
  async updateListing(listingId, listingData) {
    return api.put(`/marketplace/listings/${listingId}`, listingData);
  }

  /**
   * Delete listing
   * @param {string} listingId
   * @returns {object} deletion response
   */
  async deleteListing(listingId) {
    return api.delete(`/marketplace/listings/${listingId}`);
  }

  /**
   * Search products
   * @param {object} searchParams
   * @returns {object} search results
   */
  async searchProducts(searchParams) {
    return api.get('/marketplace/search', { params: searchParams });
  }
}

export default new MarketplaceService();