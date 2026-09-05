/**
 * AFRERA Nutrient-Value-Based Sales Service
 * 
 * Revolutionary agricultural commerce model:
 * - Sell by nutrient value rather than kilogram
 * - Nutrient-density-based pricing
 * - Quality-tiered marketplace
 * - Lab-verified nutrient content
 * - Nutrient certification system
 * - Health-value transactions
 * 
 * This transforms agricultural commerce from:
 * COMMODITY: "100kg of rice = ₹3000"
 * TO QUALITY: "100kg rice with 8% protein, 2% iron, 75% carb = ₹4500"
 * 
 * Benefits:
 * - Farmers incentivized to grow nutrient-dense crops
 * - Consumers pay for actual nutritional value
 * - Transparency in food quality
 * - Health-driven agricultural practices
 * - Premium for nutritional excellence
 */

const { logger } = require('../../../utils/logger');
const { getPostgreSQL } = require('../../../database/connection');
const { signalBus } = require('../../../core/signalBus');

// ============================================================================
// NUTRIENT-VALUE PRICING MODEL
// ============================================================================

/**
 * Calculate nutrient-value-based price for product
 * Instead of base price per kg, calculate price based on nutritional density
 */
async function calculateNutrientValuePrice(productId, nutrientContent) {
  const pg = getPostgreSQL();
  
  try {
    // Get product base information
    const product = await pg.query(`
      SELECT 
        id,
        product_name,
        category_id,
        base_price,
        unit
      FROM product_listings
      WHERE id = $1
    `, [productId]);
    
    if (product.rows.length === 0) {
      throw new Error('Product not found');
    }
    
    const productData = product.rows[0];
    
    // Get nutrient value benchmarks for category
    const benchmarks = await getNutrientBenchmarks(productData.category_id);
    
    // Calculate nutrient density scores
    const nutrientScores = {
      protein: calculateNutrientScore(nutrientContent.protein, benchmarks.protein, 0.3),
      iron: calculateNutrientScore(nutrientContent.iron, benchmarks.iron, 0.2),
      calcium: calculateNutrientScore(nutrientContent.calcium, benchmarks.calcium, 0.15),
      fiber: calculateNutrientScore(nutrientContent.fiber, benchmarks.fiber, 0.2),
      vitamins: calculateNutrientScore(nutrientContent.vitamins, benchmarks.vitamins, 0.15)
    };
    
    // Calculate overall nutrient density score
    const overallDensityScore = Object.values(nutrientScores).reduce((sum, score) => sum + score, 0);
    
    // Calculate nutrient value premium
    const basePrice = parseFloat(productData.base_price);
    const nutrientPremium = basePrice * (overallDensityScore - 0.5) * 2; // Up to 100% premium for excellent nutrition
    
    const nutrientValuePrice = Math.max(basePrice, basePrice + nutrientPremium);
    
    // Calculate price per nutrient unit
    const pricePerNutrientUnit = {
      protein_g: nutrientValuePrice / (nutrientContent.protein || 1),
      iron_mg: nutrientValuePrice / (nutrientContent.iron || 1),
      calcium_mg: nutrientValuePrice / (nutrientContent.calcium || 1),
      fiber_g: nutrientValuePrice / (nutrientContent.fiber || 1)
    };
    
    const pricing = {
      product_id: productId,
      base_price_per_kg: basePrice,
      nutrient_density_score: Math.round(overallDensityScore * 100) / 100,
      nutrient_premium: Math.round(nutrientPremium * 100) / 100,
      nutrient_value_price: Math.round(nutrientValuePrice * 100) / 100,
      premium_percentage: Math.round((nutrientPremium / basePrice) * 100),
      nutrient_scores: nutrientScores,
      price_per_nutrient_unit: pricePerNutrientUnit,
      pricing_model: 'nutrient_value_based'
    };
    
    // Store pricing
    await pg.query(`
      INSERT INTO nutrient_value_pricing 
      (product_id, pricing_data, calculated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (product_id) 
      DO UPDATE SET pricing_data = $2, calculated_at = NOW()
    `, [productId, JSON.stringify(pricing)]);
    
    // Emit signal bus event
    await signalBus.emit('nutrient.pricing.calculated', {
      product_id: productId,
      nutrient_density_score: overallDensityScore,
      nutrient_value_price: nutrientValuePrice,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Nutrient value price calculated', { productId, nutrientValuePrice });
    
    return {
      success: true,
      pricing
    };
  } catch (error) {
    logger.error('Error calculating nutrient value price', { error: error.message, productId });
    throw error;
  }
}

/**
 * Get nutrient benchmarks for category
 */
async function getNutrientBenchmarks(categoryId) {
  let pg = getPostgreSQL();
  
  try {
    let benchmarks = await pg.query(`
      SELECT 
        protein,
        iron,
        calcium,
        fiber,
        vitamins
      FROM nutrient_benchmarks
      WHERE category_id = $1
    `, [categoryId]);
    
    if (benchmarks.rows.length === 0) {
      // Return default benchmarks
      return {
        protein: 8.0,    // g per 100g
        iron: 2.0,      // mg per 100g
        calcium: 20.0,  // mg per 100g
        fiber: 3.0,     // g per 100g
        vitamins: 15.0  // mg per 100g
      };
    }
    
    return benchmarks.rows[0];
  } catch (error) {
    logger.error('Error getting nutrient benchmarks', { error: error.message });
    return {
      protein: 8.0,
      iron: 2.0,
      calcium: 20.0,
      fiber: 3.0,
      vitamins: 15.0
    };
  }
}

/**
 * Calculate individual nutrient score
 */
function calculateNutrientScore(actualValue, benchmark, weight) {
  if (!actualValue || !benchmark) return 0;
  
  const ratio = actualValue / benchmark;
  
  // Score based on how much above/below benchmark
  if (ratio >= 1.5) return weight * 1.0; // Excellent
  if (ratio >= 1.2) return weight * 0.8; // Good
  if (ratio >= 1.0) return weight * 0.6; // Meets benchmark
  if (ratio >= 0.8) return weight * 0.4; // Below benchmark
  return weight * 0.2; // Poor
}

// ============================================================================
// NUTRIENT CONTENT VERIFICATION SYSTEM
// ============================================================================

/**
 * Submit nutrient content for lab verification
 */
async function submitNutrientContent(productId, contentData, verificationData) {
  let pg = getPostgreSQL();
  
  try {
    const {
      protein,
      iron,
      calcium,
      fiber,
      vitamins,
      testing_method,
      sample_batch_number,
      testing_laboratory,
      test_date
    } = contentData;
    
    const {
      farmer_id,
      harvest_date,
      location,
      farming_practices
    } = verificationData;
    
    // Generate verification request ID
    const verificationId = `NV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const verification = {
      id: verificationId,
      product_id: productId,
      farmer_id,
      nutrient_content: {
        protein,
        iron,
        calcium,
        fiber,
        vitamins
      },
      testing_method,
      sample_batch_number,
      testing_laboratory,
      test_date,
      harvest_date,
      location,
      farming_practices,
      verification_status: 'pending',
      submitted_at: new Date().toISOString()
    };
    
    // Store verification request
    await pg.query(`
      INSERT INTO nutrient_content_verification 
      (id, product_id, farmer_id, nutrient_content, testing_method, sample_batch_number, 
       testing_laboratory, test_date, harvest_date, location, farming_practices, verification_status, submitted_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', NOW())
    `, [verificationId, productId, farmer_id, JSON.stringify(verification.nutrient_content), 
        testing_method, sample_batch_number, testing_laboratory, test_date, harvest_date, 
        location, JSON.stringify(farming_practices)]);
    
    // Emit signal bus event
    await signalBus.emit('nutrient.verification.submitted', {
      verification_id: verificationId,
      product_id: productId,
      farmer_id,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Nutrient content verification submitted', { verificationId, productId });
    
    return {
      success: true,
      verification
    };
  } catch (error) {
    logger.error('Error submitting nutrient content verification', { error: error.message });
    throw error;
  }
}

/**
 * Approve nutrient content verification
 */
async function approveNutrientVerification(verificationId, approvedBy, notes) {
  let pg = getPostgreSQL();
  
  try {
    // Get verification details
    let verification = await pg.query(`
      SELECT * FROM nutrient_content_verification
      WHERE id = $1
    `, [verificationId]);
    
    if (verification.rows.length === 0) {
      throw new Error('Verification not found');
    }
    
    const verificationData = verification.rows[0];
    
    // Update verification status
    await pg.query(`
      UPDATE nutrient_content_verification 
      SET verification_status = 'approved',
          approved_by = $1,
          approval_notes = $2,
          approved_at = NOW()
      WHERE id = $3
    `, [approvedBy, notes, verificationId]);
    
    // Calculate nutrient value price
    const nutrientContent = JSON.parse(verificationData.nutrient_content);
    await calculateNutrientValuePrice(verificationData.product_id, nutrientContent);
    
    // Update product with verified nutrient content
    await pg.query(`
      UPDATE product_listings 
      SET verified_nutrient_content = $1,
          nutrient_verification_id = $2,
          pricing_model = 'nutrient_value_based',
          updated_at = NOW()
      WHERE id = $3
    `, [JSON.stringify(nutrientContent), verificationId, verificationData.product_id]);
    
    // Emit signal bus event
    await signalBus.emit('nutrient.verification.approved', {
      verification_id: verificationId,
      product_id: verificationData.product_id,
      approved_by: approvedBy,
      timestamp: new Date().toISOString()
    });

    logger.info('Nutrient verification approved', { verificationId });

    return {
      success: true,
      verification_id: verificationId,
      product_id: verificationData.product_id
    };
  } catch (error) {
    logger.error('Error approving nutrient verification', { error: error.message });
    throw error;
  }
}

// ============================================================================
// NUTRIENT-VALUE PRODUCT LISTINGS
// ============================================================================

/**
 * Create nutrient-value-based product listing
 */
async function createNutrientValueListing(sellerId, listingData) {
  let pg = getPostgreSQL();
  
  try {
    const {
      product_name,
      category_id,
      quantity,
      unit,
      nutrient_content,
      verification_status,
      nutrient_tier,
      selling_by_nutrient,
      primary_nutrient_metric
    } = listingData;
    
    // Generate listing ID
    const listingId = `NVL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate nutrient value price
    let pricing = await calculateNutrientValuePrice(listingId, nutrient_content);
    
    const listing = {
      id: listingId,
      seller_id: sellerId,
      product_name,
      category_id,
      quantity,
      unit,
      verified_nutrient_content: JSON.stringify(nutrient_content),
      verification_status,
      nutrient_tier,
      selling_by_nutrient: selling_by_nutrient || false,
      primary_nutrient_metric: primary_nutrient_metric || 'protein',
      base_price: pricing.pricing.base_price_per_kg,
      nutrient_value_price: pricing.pricing.nutrient_value_price,
      nutrient_density_score: pricing.pricing.nutrient_density_score,
      pricing_model: 'nutrient_value_based',
      listing_status: 'active',
      created_at: new Date().toISOString()
    };
    
    // Store listing
    await pg.query(`
      INSERT INTO product_listings 
      (id, seller_id, product_name, category_id, quantity, unit, verified_nutrient_content, 
       verification_status, nutrient_tier, selling_by_nutrient, primary_nutrient_metric, 
       base_price, nutrient_value_price, nutrient_density_score, pricing_model, listing_status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'active', NOW())
    `, [listingId, sellerId, product_name, category_id, quantity, unit, JSON.stringify(nutrient_content),
        verification_status, nutrient_tier, selling_by_nutrient, primary_nutrient_metric,
        listing.base_price, listing.nutrient_value_price, listing.nutrient_density_score, 'nutrient_value_based']);
    
    // Emit signal bus event
    await signalBus.emit('nutrient.listing.created', {
      listing_id: listingId,
      seller_id: sellerId,
      nutrient_tier,
      nutrient_density_score: listing.nutrient_density_score,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Nutrient-value listing created', { listingId, nutrient_tier });
    
    return {
      success: true,
      listing
    };
  } catch (error) {
    logger.error('Error creating nutrient-value listing', { error: error.message });
    throw error;
  }
}

// ============================================================================
// NUTRIENT QUALITY TIERS AND BADGES
// ============================================================================

/**
 * Assign nutrient quality tier to product
 */
async function assignNutrientTier(productId, manualOverride = null) {
  let pg = getPostgreSQL();
  
  try {
    let nutrientDensityScore;
    
    if (manualOverride) {
      nutrientDensityScore = manualOverride;
    } else {
      // Get current nutrient density score
      let product = await pg.query(`
        SELECT nutrient_density_score
        FROM product_listings
        WHERE id = $1
      `, [productId]);
      
      if (product.rows.length === 0) {
        throw new Error('Product not found');
      }
      
      nutrientDensityScore = product.rows[0].nutrient_density_score || 0.5;
    }
    
    // Assign tier based on score
    let tier, badge, description;
    
    if (nutrientDensityScore >= 0.9) {
      tier = 'diamond';
      badge = '💎 DIAMOND';
      description = 'Exceptional nutritional excellence - top 5% of products';
    } else if (nutrientDensityScore >= 0.8) {
      tier = 'platinum';
      badge = '⭐ PLATINUM';
      description = 'Outstanding nutritional quality - top 10% of products';
    } else if (nutrientDensityScore >= 0.7) {
      tier = 'gold';
      badge = '🥇 GOLD';
      description = 'High nutritional value - top 25% of products';
    } else if (nutrientDensityScore >= 0.6) {
      tier = 'silver';
      badge = '🥈 SILVER';
      description = 'Good nutritional quality - above average';
    } else if (nutrientDensityScore >= 0.5) {
      tier = 'bronze';
      badge = '🥉 BRONZE';
      description = 'Meets nutritional standards';
    } else {
      tier = 'standard';
      badge = '📋 STANDARD';
      description = 'Basic nutritional value';
    }
    
    // Update product tier
    await pg.query(`
      UPDATE product_listings 
      SET nutrient_tier = $1,
          nutrient_badge = $2,
          nutrient_tier_description = $3,
          updated_at = NOW()
      WHERE id = $4
    `, [tier, badge, description, productId]);
    
    // Emit signal bus event
    await signalBus.emit('nutrient.tier.assigned', {
      product_id: productId,
      tier,
      badge,
      nutrient_density_score: nutrientDensityScore,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Nutrient tier assigned', { productId, tier, badge });
    
    return {
      success: true,
      product_id: productId,
      tier,
      badge,
      description,
      nutrient_density_score: nutrientDensityScore
    };
  } catch (error) {
    logger.error('Error assigning nutrient tier', { error: error.message, productId });
    throw error;
  }
}

// ============================================================================
// NUTRIENT-BASED COMPARISON TOOLS
// ============================================================================

/**
 * Compare products by nutrient value
 */
async function compareProductsByNutrient(productIds) {
  let pg = getPostgreSQL();
  
  try {
    const products = await pg.query(`
      SELECT 
        id,
        product_name,
        category_id,
        verified_nutrient_content,
        nutrient_density_score,
        nutrient_tier,
        nutrient_badge,
        nutrient_value_price,
        base_price,
        unit
      FROM product_listings
      WHERE id = ANY($1)
        AND verified_nutrient_content IS NOT NULL
    `, [productIds]);
    
    if (products.rows.length === 0) {
      return {
        success: true,
        comparison: [],
        message: 'No products with verified nutrient content found'
      };
    }
    
    // Calculate comparison metrics
    const comparison = products.rows.map(product => {
      let nutrientContent = JSON.parse(product.verified_nutrient_content);
      let basePrice = parseFloat(product.base_price);
      let nutrientValuePrice = parseFloat(product.nutrient_value_price);
      
      return {
        id: product.id,
        product_name: product.product_name,
        nutrient_tier: product.nutrient_tier,
        nutrient_badge: product.nutrient_badge,
        nutrient_density_score: parseFloat(product.nutrient_density_score),
        nutrient_content: nutrientContent,
        pricing: {
          base_price_per_kg: basePrice,
          nutrient_value_price: nutrientValuePrice,
          premium_percentage: Math.round(((nutrientValuePrice - basePrice) / basePrice) * 100),
          price_per_protein_g: nutrientValuePrice / (nutrientContent.protein || 1),
          price_per_iron_mg: nutrientValuePrice / (nutrientContent.iron || 1),
          price_per_fiber_g: nutrientValuePrice / (nutrientContent.fiber || 1)
        },
        quality_metrics: {
          protein_score: nutrientContent.protein ? Math.min(100, (nutrientContent.protein / 10) * 100) : 0,
          iron_score: nutrientContent.iron ? Math.min(100, (nutrientContent.iron / 5) * 100) : 0,
          fiber_score: nutrientContent.fiber ? Math.min(100, (nutrientContent.fiber / 5) * 100) : 0,
          overall_score: parseFloat(product.nutrient_density_score) * 100
        }
      };
    });
    
    // Sort by overall score
    comparison.sort((a, b) => b.quality_metrics.overall_score - a.quality_metrics.overall_score);
    
    // Generate comparison summary
    const summary = {
      best_value: comparison[0],
      highest_protein: comparison.sort((a, b) => b.nutrient_content.protein - a.nutrient_content.protein)[0],
      lowest_price_per_protein: comparison.sort((a, b) => a.pricing.price_per_protein_g - b.pricing.price_per_protein_g)[0],
      highest_tier: comparison.filter(p => p.nutrient_tier !== 'standard').sort((a, b) => b.quality_metrics.overall_score - a.quality_metrics.overall_score)[0]
    };
    
    logger.info('Products compared by nutrient value', { productCount: comparison.length });
    
    return {
      success: true,
      comparison,
      summary
    };
  } catch (error) {
    logger.error('Error comparing products by nutrient', { error: error.message });
    throw error;
  }
}

// ============================================================================
// NUTRIENT CERTIFICATION SYSTEM
// ============================================================================

/**
 * Issue nutrient quality certificate
 */
async function issueNutrientCertificate(productId, certificationData) {
  let pg = getPostgreSQL();
  
  try {
    const {
      certificate_type,
      certifying_body,
      certification_standard,
      valid_from,
      valid_until,
      certification_number
    } = certificationData;
    
    // Generate certificate ID
    const certificateId = `NC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const certificate = {
      id: certificateId,
      product_id: productId,
      certificate_type,
      certifying_body,
      certification_standard,
      certification_number,
      valid_from,
      valid_until,
      certificate_status: 'active',
      issued_at: new Date().toISOString()
    };
    
    // Store certificate
    await pg.query(`
      INSERT INTO nutrient_certificates 
      (id, product_id, certificate_type, certifying_body, certification_standard, 
       certification_number, valid_from, valid_until, certificate_status, issued_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', NOW())
    `, [certificateId, productId, certificate_type, certifying_body, certification_standard,
        certification_number, valid_from, valid_until]);
    
    // Update product with certificate
    await pg.query(`
      UPDATE product_listings 
      SET nutrient_certificate_id = $1,
          certification_body = $2,
          updated_at = NOW()
      WHERE id = $3
    `, [certificateId, certifying_body, productId]);
    
    // Emit signal bus event
    await signalBus.emit('nutrient.certificate.issued', {
      certificate_id: certificateId,
      product_id: productId,
      certificate_type,
      certifying_body,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Nutrient certificate issued', { certificateId, productId });
    
    return {
      success: true,
      certificate
    };
  } catch (error) {
    logger.error('Error issuing nutrient certificate', { error: error.message });
    throw error;
  }
}

// ============================================================================
// NUTRIENT-BASED COMMISSION STRUCTURE
// ============================================================================

/**
 * Calculate commission based on nutrient quality
 */
async function calculateNutrientBasedCommission(orderId) {
  let pg = getPostgreSQL();
  
  try {
    // Get order items with nutrient information
    const orderItems = await pg.query(`
      SELECT 
        oi.*,
        pl.nutrient_tier,
        pl.nutrient_density_score,
        pl.nutrient_value_price,
        pl.base_price
      FROM order_items oi
      JOIN product_listings pl ON oi.product_id = pl.id
      WHERE oi.order_id = $1
    `, [orderId]);
    
    if (orderItems.rows.length === 0) {
      throw new Error('Order items not found');
    }
    
    // Calculate commission for each item based on nutrient tier
    const commissionRates = {
      'diamond': 0.03,    // 3% for diamond tier (lower commission to incentivize quality)
      'platinum': 0.04,  // 4% for platinum tier
      'gold': 0.05,      // 5% for gold tier
      'silver': 0.06,    // 6% for silver tier
      'bronze': 0.07,    // 7% for bronze tier
      'standard': 0.10   // 10% for standard tier
    };
    
    const commissionBreakdown = orderItems.rows.map(item => {
      const tier = item.nutrient_tier || 'standard';
      const commissionRate = commissionRates[tier];
      const itemValue = item.quantity * item.nutrient_value_price;
      const commissionAmount = itemValue * commissionRate;
      
      return {
        order_item_id: item.id,
        product_id: item.product_id,
        nutrient_tier: tier,
        nutrient_density_score: parseFloat(item.nutrient_density_score),
        item_value: itemValue,
        commission_rate: commissionRate,
        commission_amount: Math.round(commissionAmount * 100) / 100
      };
    });
    
    // Calculate totals
    const totalCommission = commissionBreakdown.reduce((sum, item) => sum + item.commission_amount, 0);
    const totalValue = commissionBreakdown.reduce((sum, item) => sum + item.item_value, 0);
    const averageCommissionRate = totalCommission / totalValue;
    
    // Store commission record
    const commissionId = `NBC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await pg.query(`
      INSERT INTO nutrient_based_commissions 
      (id, order_id, commission_breakdown, total_commission, total_value, average_commission_rate, calculated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [commissionId, orderId, JSON.stringify(commissionBreakdown), totalCommission, totalValue, averageCommissionRate]);
    
    logger.info('Nutrient-based commission calculated', { orderId, totalCommission });
    
    return {
      success: true,
      commission_id: commissionId,
      order_id: orderId,
      commission_breakdown: commissionBreakdown,
      total_commission: Math.round(totalCommission * 100) / 100,
      total_value: Math.round(totalValue * 100) / 100,
      average_commission_rate: Math.round(averageCommissionRate * 10000) / 100
    };
  } catch (error) {
    logger.error('Error calculating nutrient-based commission', { error: error.message, orderId });
    throw error;
  }
}

// ============================================================================
// NUTRIENT-VALUE MARKETPLACE SEARCH
// ============================================================================

/**
 * Search products by nutrient criteria
 */
async function searchByNutrientCriteria(criteria) {
  let pg = getPostgreSQL();
  
  try {
    const {
      min_protein,
      min_iron,
      min_calcium,
      min_fiber,
      min_nutrient_score,
      nutrient_tier,
      selling_by_nutrient,
      category_id
    } = criteria;
    
    let query = `
      SELECT 
        pl.*,
        pl.verified_nutrient_content
      FROM product_listings pl
      WHERE pl.listing_status = 'active'
        AND pl.verified_nutrient_content IS NOT NULL
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (min_protein) {
      paramCount++;
      query += ` AND (pl.verified_nutrient_content->>'protein')::numeric >= $${paramCount}`;
      params.push(min_protein);
    }
    
    if (min_iron) {
      paramCount++;
      query += ` AND (pl.verified_nutrient_content->>'iron')::numeric >= $${paramCount}`;
      params.push(min_iron);
    }
    
    if (min_fiber) {
      paramCount++;
      query += ` AND (pl.verified_nutrient_content->>'fiber')::numeric >= $${paramCount}`;
      params.push(min_fiber);
    }
    
    if (min_nutrient_score) {
      paramCount++;
      query += ` AND pl.nutrient_density_score >= $${paramCount}`;
      params.push(min_nutrient_score);
    }
    
    if (nutrient_tier) {
      paramCount++;
      query += ` AND pl.nutrient_tier = $${paramCount}`;
      params.push(nutrient_tier);
    }
    
    if (selling_by_nutrient !== undefined) {
      paramCount++;
      query += ` AND pl.selling_by_nutrient = $${paramCount}`;
      params.push(selling_by_nutrient);
    }
    
    if (category_id) {
      paramCount++;
      query += ` AND pl.category_id = $${paramCount}`;
      params.push(category_id);
    }
    
    query += ` ORDER BY pl.nutrient_density_score DESC, pl.nutrient_value_price ASC`;
    
    const result = await pg.query(query, params);
    
    // Parse nutrient content for each product
    let products = result.rows.map(product => ({
      ...product,
      verified_nutrient_content: JSON.parse(product.verified_nutrient_content)
    }));
    
    logger.info('Products searched by nutrient criteria', { resultCount: products.length });
    
    return {
      success: true,
      criteria,
      result_count: products.length,
      products
    };
  } catch (error) {
    logger.error('Error searching by nutrient criteria', { error: error.message });
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Nutrient-Value Pricing
  calculateNutrientValuePrice,
  getNutrientBenchmarks,
  
  // Nutrient Content Verification
  submitNutrientContent,
  approveNutrientVerification,
  
  // Nutrient-Value Listings
  createNutrientValueListing,
  
  // Nutrient Quality Tiers
  assignNutrientTier,
  
  // Nutrient-Based Comparison
  compareProductsByNutrient,
  
  // Nutrient Certification
  issueNutrientCertificate,
  
  // Nutrient-Based Commission
  calculateNutrientBasedCommission,
  
  // Nutrient-Value Search
  searchByNutrientCriteria
};

