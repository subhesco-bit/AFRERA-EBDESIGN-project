/**
 * Product Review Service - real unit tests.
 *
 * Context: backend/src/services/legacy/productReviewService.js is the
 * canonical, DB-backed implementation (mounted via
 * backend/src/routes/productReviewRoutes.js and
 * backend/src/routes/marketplaceEnhancements.js). It used to exist as three
 * near-duplicate copies (services/productReviewService.js,
 * services/commerce/productReviewService.js, services/legacy/...). The two
 * non-legacy copies were dead code (never required by index.js) and carried
 * no unique logic, so they were collapsed to thin re-export wrappers around
 * the legacy file. These tests both exercise the real query-building logic
 * of the canonical service and guard the wrapper consolidation itself.
 */

'use strict';

const mockPool = { query: jest.fn() };

jest.mock('../../database/pool', () => mockPool);

const legacyService = require('../../services/legacy/productReviewService');
const rootWrapper = require('../../services/productReviewService');
const commerceWrapper = require('../../services/commerce/productReviewService');

describe('productReviewService consolidation', () => {
  it('root and commerce wrappers re-export the exact same canonical instance as legacy', () => {
    expect(rootWrapper).toBe(legacyService);
    expect(commerceWrapper).toBe(legacyService);
  });

  it('exposes the full real API surface, not a stub', () => {
    const expectedMethods = [
      'createReview',
      'getProductReviews',
      'getProductReviewStats',
      'updateProductRating',
      'markReviewHelpful',
      'updateReview',
      'deleteReview',
      'moderateReview',
      'getUserReviews',
      'reportReview'
    ];

    for (const method of expectedMethods) {
      expect(typeof legacyService[method]).toBe('function');
    }
  });
});

describe('ProductReviewService (canonical, DB-mocked)', () => {
  beforeEach(() => {
    mockPool.query.mockReset();
  });

  describe('createReview', () => {
    it('marks a review as a verified purchase when the user actually bought the product', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'order-item-1' }] }) // purchase check
        .mockResolvedValueOnce({ rows: [{ id: 'review-1', verified_purchase: true }] }) // insert
        .mockResolvedValueOnce({ rows: [{ id: 'product-1' }] }); // updateProductRating

      const result = await legacyService.createReview('user-1', 'product-1', {
        rating: 5,
        title: 'Great turmeric',
        comment: 'Very fresh',
        images: [],
        verifiedPurchase: true
      });

      expect(result).toEqual({ id: 'review-1', verified_purchase: true });

      const insertCall = mockPool.query.mock.calls[1];
      expect(insertCall[0]).toMatch(/INSERT INTO product_reviews/);
      // hasPurchased (from the purchase check) is passed through as the
      // verified_purchase column value, not the caller-supplied flag.
      expect(insertCall[1]).toEqual([
        'user-1', 'product-1', 5, 'Great turmeric', 'Very fresh', '[]', true
      ]);
    });

    it('rejects a verified-purchase claim when no matching order exists', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // no purchase found

      await expect(
        legacyService.createReview('user-1', 'product-1', {
          rating: 5,
          verifiedPurchase: true
        })
      ).rejects.toThrow('Cannot mark as verified purchase - no purchase found');

      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateProductRating', () => {
    it('uses AVG (not the earlier AG typo) when recomputing average_rating', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'product-1', average_rating: 4.2 }] });

      await legacyService.updateProductRating('product-1');

      const [query] = mockPool.query.mock.calls[0];
      expect(query).toMatch(/COALESCE\(AVG\(rating\), 0\)/);
      expect(query).not.toMatch(/COALESCE\(AG\(/);
    });
  });

  describe('markReviewHelpful', () => {
    it('toggles off (removes the mark) when already marked helpful by this user', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'helpful-1' }] }) // existing mark found
        .mockResolvedValueOnce({}) // delete
        .mockResolvedValueOnce({}); // decrement helpful_count

      const result = await legacyService.markReviewHelpful('review-1', 'user-1');

      expect(result).toEqual({ marked: false });
      expect(mockPool.query.mock.calls[1][0]).toMatch(/DELETE FROM review_helpful/);
      expect(mockPool.query.mock.calls[2][0]).toMatch(/helpful_count = helpful_count - 1/);
    });

    it('toggles on (adds the mark) when not previously marked helpful', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // no existing mark
        .mockResolvedValueOnce({}) // insert
        .mockResolvedValueOnce({}); // increment helpful_count

      const result = await legacyService.markReviewHelpful('review-1', 'user-2');

      expect(result).toEqual({ marked: true });
      expect(mockPool.query.mock.calls[1][0]).toMatch(/INSERT INTO review_helpful/);
      expect(mockPool.query.mock.calls[2][0]).toMatch(/helpful_count \+ 1/);
    });
  });

  describe('deleteReview', () => {
    it('scopes the delete to the owning user when not an admin', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

      const result = await legacyService.deleteReview('review-1', 'user-1', false);

      expect(result).toEqual({ success: true });
      const [query, params] = mockPool.query.mock.calls[0];
      expect(query).toMatch(/AND user_id = \$2/);
      expect(params).toEqual(['review-1', 'user-1']);
    });

    it('throws when the review does not exist or is not owned by the caller', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 0 });

      await expect(legacyService.deleteReview('review-1', 'user-1', false))
        .rejects.toThrow('Review not found or unauthorized');
    });
  });
});
