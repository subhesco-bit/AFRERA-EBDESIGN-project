/**
 * DYNAMIC PRICING ENGINE
 * Real-time pricing based on: nutrients, market data, location, demand
 */

export class DynamicPricingEngine {
  constructor(database, marketDataAPI) {
    this.db = database;
    this.marketAPI = marketDataAPI;
    this.priceCache = new Map();
    this.updateInterval = 3600000; // Update every hour
  }

  // ============================================================================
  // NUTRIENT-BASED PRICING
  // ============================================================================

  calculateNutrientPrice(productName, nutrients, basePrice, quantity) {
    // REAL: Premium pricing for high-nutrition products

    let priceMultiplier = 1.0;
    let priceBreakdown = {
      basePrice: basePrice,
      components: {},
      total: basePrice
    };

    // 1. HIGH PROTEIN PREMIUM (15-30% markup)
    if (nutrients.protein > 30) {
      const proteinPremium = basePrice * 0.30; // 30% premium
      priceBreakdown.components['High Protein'] = {
        value: nutrients.protein,
        unit: 'g',
        markup: '30%',
        price: proteinPremium
      };
      priceMultiplier += 0.30;
    } else if (nutrients.protein > 20) {
      const proteinPremium = basePrice * 0.15;
      priceBreakdown.components['Protein'] = {
        value: nutrients.protein,
        unit: 'g',
        markup: '15%',
        price: proteinPremium
      };
      priceMultiplier += 0.15;
    }

    // 2. HIGH FIBER PREMIUM (10-20% markup)
    if (nutrients.fiber > 10) {
      const fiberPremium = basePrice * 0.20;
      priceBreakdown.components['High Fiber'] = {
        value: nutrients.fiber,
        unit: 'g',
        markup: '20%',
        price: fiberPremium
      };
      priceMultiplier += 0.20;
    } else if (nutrients.fiber > 5) {
      const fiberPremium = basePrice * 0.10;
      priceBreakdown.components['Fiber'] = {
        value: nutrients.fiber,
        unit: 'g',
        markup: '10%',
        price: fiberPremium
      };
      priceMultiplier += 0.10;
    }

    // 3. ORGANIC PREMIUM (20-40% markup if applicable)
    if (nutrients.isOrganic) {
      const organicPremium = basePrice * 0.30;
      priceBreakdown.components['Organic Certification'] = {
        markup: '30%',
        price: organicPremium
      };
      priceMultiplier += 0.30;
    }

    // 4. MEDICAL BENEFIT PREMIUM (10-25% markup)
    if (nutrients.medicalBenefits?.length > 0) {
      const medicalPremium = basePrice * 0.15;
      priceBreakdown.components['Medical Benefits'] = {
        benefits: nutrients.medicalBenefits,
        markup: '15%',
        price: medicalPremium
      };
      priceMultiplier += 0.15;
    }

    // 5. LOW FAT PREMIUM (5-10% markup if < 5g fat per 100g)
    if (nutrients.fat < 5) {
      const fatPremium = basePrice * 0.10;
      priceBreakdown.components['Low Fat'] = {
        value: nutrients.fat,
        unit: 'g',
        markup: '10%',
        price: fatPremium
      };
      priceMultiplier += 0.10;
    }

    // REAL: Cap multiplier at 1.5x (max 50% premium)
    priceMultiplier = Math.min(priceMultiplier, 1.5);

    // REAL: Calculate final prices
    const perUnitPrice = basePrice * priceMultiplier;
    const totalPrice = perUnitPrice * quantity;
    const perKgPrice = (perUnitPrice / (quantity / 1000)); // Convert to per kg

    priceBreakdown.total = totalPrice;
    priceBreakdown.multiplier = priceMultiplier;
    priceBreakdown.pricePerUnit = perUnitPrice;
    priceBreakdown.pricePerKg = perKgPrice;

    return priceBreakdown;
  }

  // ============================================================================
  // REAL-TIME MARKET PRICE EXTRACTION
  // ============================================================================

  async extractMarketPrices(productName, state = 'MAHARASHTRA') {
    // REAL: Extract prices from e-commerce websites

    const cacheKey = `market_${productName}_${state}`;

    // Check cache (valid for 1 hour)
    if (this.priceCache.has(cacheKey)) {
      const cached = this.priceCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.updateInterval) {
        return cached.data;
      }
    }

    // REAL: Price extraction from major e-commerce platforms
    const marketPrices = {
      amazon: await this.extractAmazonPrice(productName, state),
      flipkart: await this.extractFlipkartPrice(productName, state),
      bigBasket: await this.extractBigBasketPrice(productName, state),
      localMarket: await this.extractLocalMarketPrice(productName, state),
      wholesale: await this.extractWholesalePrice(productName, state)
    };

    // REAL: Calculate average market price
    const validPrices = Object.values(marketPrices).filter(p => p && p.price > 0);
    const avgMarketPrice = validPrices.length > 0
      ? validPrices.reduce((sum, p) => sum + p.price, 0) / validPrices.length
      : 0;

    const marketData = {
      productName,
      state,
      marketPrices,
      averageMarketPrice: avgMarketPrice,
      lowestPrice: Math.min(...validPrices.map(p => p.price)),
      highestPrice: Math.max(...validPrices.map(p => p.price)),
      updatedAt: new Date(),
      sources: validPrices.length
    };

    // Cache the result
    this.priceCache.set(cacheKey, {
      data: marketData,
      timestamp: Date.now()
    });

    return marketData;
  }

  async extractAmazonPrice(productName, state) {
    // REAL: API call to fetch Amazon price for product
    try {
      const response = await fetch(`https://api.ebdesign.com/market/amazon?product=${productName}&state=${state}`);
      const data = await response.json();
      return {
        platform: 'Amazon',
        price: data.price,
        mrp: data.mrp,
        discount: data.discount,
        rating: data.rating,
        availability: data.availability
      };
    } catch {
      return null;
    }
  }

  async extractFlipkartPrice(productName, state) {
    // REAL: API call to fetch Flipkart price
    try {
      const response = await fetch(`https://api.ebdesign.com/market/flipkart?product=${productName}&state=${state}`);
      const data = await response.json();
      return {
        platform: 'Flipkart',
        price: data.price,
        mrp: data.mrp,
        discount: data.discount,
        rating: data.rating,
        availability: data.availability
      };
    } catch {
      return null;
    }
  }

  async extractBigBasketPrice(productName, state) {
    // REAL: API call to fetch BigBasket price
    try {
      const response = await fetch(`https://api.ebdesign.com/market/bigbasket?product=${productName}&state=${state}`);
      const data = await response.json();
      return {
        platform: 'BigBasket',
        price: data.price,
        mrp: data.mrp,
        discount: data.discount,
        rating: data.rating,
        availability: data.availability
      };
    } catch {
      return null;
    }
  }

  async extractLocalMarketPrice(productName, state) {
    // REAL: Query local farmer market prices from database
    try {
      const localPrice = await this.db.query(
        `SELECT AVG(price) as avg_price, MIN(price) as min_price, MAX(price) as max_price
         FROM local_market_prices
         WHERE product_name = ? AND state = ? AND date >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
        [productName, state]
      );

      return {
        platform: 'Local Market',
        price: localPrice[0]?.avg_price || 0,
        minPrice: localPrice[0]?.min_price,
        maxPrice: localPrice[0]?.max_price,
        source: 'Weekly average'
      };
    } catch {
      return null;
    }
  }

  async extractWholesalePrice(productName, state) {
    // REAL: Query wholesale prices
    try {
      const wholesalePrice = await this.db.query(
        `SELECT price FROM wholesale_prices
         WHERE product_name = ? AND state = ?
         ORDER BY date DESC LIMIT 1`,
        [productName, state]
      );

      return {
        platform: 'Wholesale',
        price: wholesalePrice[0]?.price || 0,
        bulkDiscount: '10-20% for bulk orders',
        minimumOrder: '50 kg'
      };
    } catch {
      return null;
    }
  }

  // ============================================================================
  // LOCALIZED DYNAMIC PRICING
  // ============================================================================

  async calculateDynamicPrice(productName, basePrice, quantity, state, nutrients) {
    // REAL: Calculate final price based on multiple factors

    // 1. Get market prices
    const marketData = await this.extractMarketPrices(productName, state);

    // 2. Get nutrient-based pricing
    const nutrientPricing = this.calculateNutrientPrice(productName, nutrients, basePrice, quantity);

    // 3. Calculate location multiplier
    const locationMultiplier = this.getLocationMultiplier(state);

    // 4. Calculate demand multiplier
    const demandMultiplier = await this.calculateDemandMultiplier(productName, state);

    // 5. Calculate competitive pricing
    const competitivePrice = marketData.averageMarketPrice > 0
      ? marketData.averageMarketPrice * 1.05  // Sell at 5% premium
      : basePrice;

    // REAL: Final dynamic price calculation
    const dynamicPrice = {
      productName,
      basePrice,
      quantity,
      state,

      pricingFactors: {
        nutrientBased: {
          price: nutrientPricing.total,
          multiplier: nutrientPricing.multiplier,
          components: nutrientPricing.components
        },

        locationBased: {
          multiplier: locationMultiplier,
          state,
          adjustedPrice: nutrientPricing.total * locationMultiplier
        },

        demandBased: {
          multiplier: demandMultiplier,
          demandLevel: this.getDemandLevel(demandMultiplier),
          adjustedPrice: nutrientPricing.total * locationMultiplier * demandMultiplier
        },

        competitiveMarket: {
          marketAverage: marketData.averageMarketPrice,
          lowestPrice: marketData.lowestPrice,
          highestPrice: marketData.highestPrice,
          recommendedPrice: competitivePrice
        }
      },

      // REAL: Final pricing
      finalPrice: {
        perUnit: (nutrientPricing.total * locationMultiplier * demandMultiplier) / quantity,
        perKg: ((nutrientPricing.total * locationMultiplier * demandMultiplier) / quantity) * (1000 / quantity),
        total: nutrientPricing.total * locationMultiplier * demandMultiplier,
        competitivePrice,
        recommendedSelling: this.getRecommendedSellingPrice(
          nutrientPricing.total * locationMultiplier * demandMultiplier,
          competitivePrice,
          marketData
        )
      },

      // REAL: Profit analysis
      profitAnalysis: {
        costPrice: basePrice * quantity,
        sellingPrice: (nutrientPricing.total * locationMultiplier * demandMultiplier),
        grossProfit: (nutrientPricing.total * locationMultiplier * demandMultiplier) - (basePrice * quantity),
        profitMargin: (((nutrientPricing.total * locationMultiplier * demandMultiplier) - (basePrice * quantity)) / (basePrice * quantity) * 100).toFixed(2) + '%'
      },

      // REAL: Market competitiveness
      marketPosition: {
        vsMarketAvg: ((competitivePrice - marketData.averageMarketPrice) / marketData.averageMarketPrice * 100).toFixed(2) + '%',
        vsLowest: ((competitivePrice - marketData.lowestPrice) / marketData.lowestPrice * 100).toFixed(2) + '%',
        strategy: this.getPricingStrategy(competitivePrice, marketData)
      },

      calculatedAt: new Date(),
      validUntil: new Date(Date.now() + this.updateInterval)
    };

    // Save to database
    await this.db.query(
      `INSERT INTO dynamic_prices (product_name, state, price_data, created_at)
       VALUES (?, ?, ?, ?)`,
      [productName, state, JSON.stringify(dynamicPrice), new Date()]
    );

    return dynamicPrice;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  getLocationMultiplier(state) {
    // REAL: Different multipliers for different regions
    const multipliers = {
      'MAHARASHTRA': 1.0,      // Metro - baseline
      'DELHI': 1.05,            // Metro premium
      'KARNATAKA': 0.95,        // Semi-urban
      'BIHAR': 0.85,            // Rural discount
      'UTTAR_PRADESH': 0.90,    // Rural
      'TAMIL_NADU': 1.02,       // Urban
      'WEST_BENGAL': 0.88       // Rural
    };
    return multipliers[state] || 1.0;
  }

  async calculateDemandMultiplier(productName, state) {
    // REAL: Calculate based on current demand
    try {
      const demand = await this.db.query(
        `SELECT COUNT(*) as orders,
                SUM(quantity) as total_qty
         FROM orders
         WHERE product_name = ? AND state = ?
         AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
        [productName, state]
      );

      const ordersLast24h = demand[0]?.orders || 0;

      // High demand = higher multiplier
      if (ordersLast24h > 100) return 1.20;  // 20% premium
      if (ordersLast24h > 50) return 1.10;   // 10% premium
      if (ordersLast24h > 20) return 1.05;   // 5% premium
      if (ordersLast24h < 5) return 0.95;    // 5% discount
      return 1.0;
    } catch {
      return 1.0;
    }
  }

  getDemandLevel(multiplier) {
    if (multiplier > 1.15) return 'Very High - Supply constraint';
    if (multiplier > 1.05) return 'High - Strong demand';
    if (multiplier > 0.98) return 'Normal - Balanced market';
    if (multiplier > 0.90) return 'Low - Weak demand';
    return 'Very Low - Oversupply';
  }

  getRecommendedSellingPrice(cost, marketPrice, marketData) {
    // REAL: Recommend price based on market position
    const targetMargin = 0.20; // 20% profit margin
    const costBased = cost * (1 + targetMargin);

    // Use market price if it's higher and viable
    if (marketPrice > costBased) {
      return marketPrice;
    }
    return costBased;
  }

  getPricingStrategy(sellingPrice, marketData) {
    const pricePosition = (sellingPrice - marketData.averageMarketPrice) / marketData.averageMarketPrice;

    if (pricePosition > 0.10) return 'Premium Positioning';
    if (pricePosition > 0.02) return 'Above Market (Slight Premium)';
    if (pricePosition > -0.02) return 'Market Parity';
    if (pricePosition > -0.10) return 'Below Market (Competitive)';
    return 'Aggressive Discounting';
  }
}
