/**
 * Advanced Search Service
 * Enhanced search with filters, indexing, and relevance scoring
 */

const { getPostgreSQL } = require('../database/connection');

class AdvancedSearchService {
  constructor() {
    this.pool = null;
    this.searchIndex = new Map();
  }

  async getPool() {
    if (!this.pool) {
      this.pool = await getPostgreSQL();
    }
    return this.pool;
  }

  /**
   * Perform advanced search with filters
   */
  async advancedSearch(searchParams) {
    try {
      const {
        query,
        category,
        priceRange,
        location,
        rating,
        sortBy,
        page = 1,
        limit = 20
      } = searchParams;

      if (!query || typeof query !== 'string' || query.length > 200) throw new Error('query is required and must be at most 200 characters');
      if (!Number.isInteger(Number(page)) || Number(page) < 1 || !Number.isInteger(Number(limit)) || Number(limit) < 1 || Number(limit) > 100) {
        throw new Error('invalid pagination');
      }

      const pool = await this.getPool();
      const offset = (page - 1) * limit;

      // Build dynamic query
      let baseQuery = `
        SELECT 
          p.id, p.name, p.description, p.price, p.category, 
          p.location, p.rating, p.stock, p.image_url,
          f.name as farmer_name, f.fdi_score,
          ts_rank_cd(search_vector, plainto_tsquery($1)) as relevance
        FROM products p
        LEFT JOIN farmers f ON p.farmer_id = f.id
        WHERE 
          p.is_active = true
          AND search_vector @@ plainto_tsquery($1)
      `;

      const queryParams = [query];
      let paramCount = 1;

      // Add category filter
      if (category) {
        paramCount++;
        baseQuery += ` AND p.category = $${paramCount}`;
        queryParams.push(category);
      }

      // Add price range filter
      if (priceRange && priceRange.min && priceRange.max) {
        paramCount++;
        baseQuery += ` AND p.price BETWEEN $${paramCount} AND $${paramCount + 1}`;
        queryParams.push(priceRange.min, priceRange.max);
        paramCount++;
      }

      // Add location filter
      if (location) {
        paramCount++;
        baseQuery += ` AND p.location ILIKE $${paramCount}`;
        queryParams.push(`%${location}%`);
      }

      // Add rating filter
      if (rating) {
        paramCount++;
        baseQuery += ` AND p.rating >= $${paramCount}`;
        queryParams.push(rating);
      }

      // Add sorting
      let orderClause = 'ORDER BY relevance DESC, p.rating DESC';
      if (sortBy === 'price_low') {
        orderClause = 'ORDER BY p.price ASC';
      } else if (sortBy === 'price_high') {
        orderClause = 'ORDER BY p.price DESC';
      } else if (sortBy === 'rating') {
        orderClause = 'ORDER BY p.rating DESC';
      } else if (sortBy === 'newest') {
        orderClause = 'ORDER BY p.created_at DESC';
      }

      baseQuery += ` ${orderClause} LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      queryParams.push(limit, offset);

      const result = await pool.query(baseQuery, queryParams);

      // Reuse the same filter fragments and parameter order for the count.
      const countParams = [query];
      let countParam = 1;
      let countFilters = 'p.is_active = true AND search_vector @@ plainto_tsquery($1)';
      if (category) { countParam++; countFilters += ` AND p.category = $${countParam}`; countParams.push(category); }
      if (priceRange && priceRange.min !== undefined && priceRange.max !== undefined) {
        countParam++; countFilters += ` AND p.price BETWEEN $${countParam} AND $${countParam + 1}`; countParams.push(priceRange.min, priceRange.max); countParam++;
      }
      if (location) { countParam++; countFilters += ` AND p.location ILIKE $${countParam}`; countParams.push(`%${location}%`); }
      if (rating) { countParam++; countFilters += ` AND p.rating >= $${countParam}`; countParams.push(rating); }
      const countQuery = `SELECT COUNT(*) as total FROM products p WHERE ${countFilters}`;

      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

      return {
        success: true,
        results: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        filters: {
          query,
          category,
          priceRange,
          location,
          rating,
          sortBy
        }
      };
    } catch (error) {
      console.error('Error in advanced search:', error);
      throw new Error('Search failed');
    }
  }

  /**
   * Get search suggestions
   */
  async getSearchSuggestions(query, limit = 10) {
    try {
      let pool = await this.getPool();
      
      const searchQuery = `
        SELECT DISTINCT name, category
        FROM products
        WHERE 
          is_active = true
          AND name ILIKE $1
        ORDER BY 
          CASE 
            WHEN name ILIKE $2 THEN 1
            WHEN name ILIKE $3 THEN 2
            ELSE 3
          END,
          name
        LIMIT $4
      `;

      let result = await pool.query(searchQuery, [
        `%${query}%`,
        `${query}%`,
        `%${query}%`,
        limit
      ]);

      return {
        success: true,
        suggestions: result.rows
      };
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return {
        success: true,
        suggestions: []
      };
    }
  }

  /**
   * Get popular search terms
   */
  async getPopularSearchTerms(limit = 10) {
    try {
      let pool = await this.getPool();
      
      const query = `
        SELECT 
          search_term,
          COUNT(*) as search_count
        FROM search_logs
        WHERE searched_at > NOW() - INTERVAL '30 days'
        GROUP BY search_term
        ORDER BY search_count DESC
        LIMIT $1
      `;

      let result = await pool.query(query, [limit]);

      return {
        success: true,
        popularTerms: result.rows
      };
    } catch (error) {
      console.error('Error getting popular search terms:', error);
      return {
        success: true,
        popularTerms: []
      };
    }
  }

  /**
   * Log search query for analytics
   */
  async logSearch(searchData) {
    try {
      let pool = await this.getPool();
      const { userId, query, resultsCount, filters } = searchData;

      const logQuery = `
        INSERT INTO search_logs (user_id, search_term, results_count, filters, searched_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      `;

      await pool.query(logQuery, [
        userId || null,
        query,
        resultsCount,
        JSON.stringify(filters || {})
      ]);
    } catch (error) {
      console.error('Error logging search:', error);
    }
  }

  /**
   * Get available filters for search
   */
  async getAvailableFilters() {
    try {
      let pool = await this.getPool();

      // Get categories
      const categoriesQuery = `
        SELECT DISTINCT category, COUNT(*) as count
        FROM products
        WHERE is_active = true
        GROUP BY category
        ORDER BY count DESC
      `;
      const categoriesResult = await pool.query(categoriesQuery);

      // Get price range
      const priceQuery = `
        SELECT 
          MIN(price) as min_price,
          MAX(price) as max_price,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) as median_price
        FROM products
        WHERE is_active = true
      `;
      const priceResult = await pool.query(priceQuery);

      // Get locations
      const locationsQuery = `
        SELECT DISTINCT location, COUNT(*) as count
        FROM products
        WHERE is_active = true AND location IS NOT NULL
        GROUP BY location
        ORDER BY count DESC
        LIMIT 20
      `;
      const locationsResult = await pool.query(locationsQuery);

      return {
        success: true,
        filters: {
          categories: categoriesResult.rows,
          priceRange: {
            min: parseFloat(priceResult.rows[0].min_price),
            max: parseFloat(priceResult.rows[0].max_price),
            median: parseFloat(priceResult.rows[0].median_price)
          },
          locations: locationsResult.rows,
          ratingOptions: [
            { value: 4, label: '4+ Stars' },
            { value: 3, label: '3+ Stars' },
            { value: 2, label: '2+ Stars' },
            { value: 1, label: '1+ Stars' }
          ],
          sortOptions: [
            { value: 'relevance', label: 'Relevance' },
            { value: 'price_low', label: 'Price: Low to High' },
            { value: 'price_high', label: 'Price: High to Low' },
            { value: 'rating', label: 'Highest Rated' },
            { value: 'newest', label: 'Newest' }
          ]
        }
      };
    } catch (error) {
      console.error('Error getting available filters:', error);
      throw new Error('Failed to get filters');
    }
  }
}

module.exports = new AdvancedSearchService();