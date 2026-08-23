// Service for Farmer Registration (M021) - AI Enhanced
// Comprehensive farmer registration with AI-powered onboarding and verification
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { signalBus, SIGNAL, SEVERITY } = require('../../core/signalBus');

// Farmer registration
async function registerFarmer(farmerData) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { name, email, phone, dateOfBirth, gender, address, landSize, primaryCrop, skills, education, farmingExperience } = farmerData;
  
  const res = await pg.query(
    `INSERT INTO farmers (name, email, phone, date_of_birth, gender, address, land_size, primary_crop, skills, education, farming_experience, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active', NOW(), NOW())
     RETURNING *`,
    [name, email, phone, dateOfBirth, gender, JSON.stringify(address), landSize, primaryCrop, JSON.stringify(skills || []), education, farmingExperience]
  );
  
  // Emit signal for farmer registration
  signalBus.emitSignal(SIGNAL.ORGANIZATION_CREATED, {
    entityType: 'farmer',
    farmerId: res.rows[0].id,
    name,
    email,
    primaryCrop
  }, {
    severity: SEVERITY.INFO,
    source: 'farmer_registration_service',
    entityId: res.rows[0].id
  });
  
  return res.rows[0];
}

async function getFarmer(farmerId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const res = await pg.query('SELECT * FROM farmers WHERE id = $1', [farmerId]);
  return res.rows[0] || null;
}

async function getFarmerByEmail(email) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const res = await pg.query('SELECT * FROM farmers WHERE email = $1', [email]);
  return res.rows[0] || null;
}

async function listFarmers({ page = 1, limit = 20, status, primaryCrop } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM farmers WHERE 1=1';
  const params = [];
  let paramIndex = 1;
  
  if (status) {
    query += ` AND status = $${paramIndex++}`;
    params.push(status);
  }
  if (primaryCrop) {
    query += ` AND primary_crop = $${paramIndex++}`;
    params.push(primaryCrop);
  }
  
  query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);
  
  const res = await pg.query(query, params);
  const totalRes = await pg.query(query.replace(`SELECT * FROM farmers`, 'SELECT COUNT(*) FROM farmers').split('LIMIT')[0], params.slice(0, -2));
  const total = parseInt(totalRes.rows[0].count || '0');
  
  return { items: res.rows, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } };
}

async function updateFarmer(farmerId, updates) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { name, email, phone, address, landSize, primaryCrop, skills, education, farmingExperience, status } = updates;
  
  const res = await pg.query(
    `UPDATE farmers 
     SET name = COALESCE($1, name),
         email = COALESCE($2, email),
         phone = COALESCE($3, phone),
         address = COALESCE($4, address),
         land_size = COALESCE($5, land_size),
         primary_crop = COALESCE($6, primary_crop),
         skills = COALESCE($7, skills),
         education = COALESCE($8, education),
         farming_experience = COALESCE($9, farming_experience),
         status = COALESCE($10, status),
         updated_at = NOW()
     WHERE id = $11
     RETURNING *`,
    [name, email, phone, address ? JSON.stringify(address) : null, landSize, primaryCrop, skills ? JSON.stringify(skills) : null, education, farmingExperience, status, farmerId]
  );
  
  // Emit signal for farmer update
  signalBus.emitSignal(SIGNAL.ORGANIZATION_UPDATED, {
    entityType: 'farmer',
    farmerId,
    action: 'updated'
  }, {
    severity: SEVERITY.INFO,
    source: 'farmer_registration_service',
    entityId: farmerId
  });
  
  return res.rows[0] || null;
}

// AI-powered farmer analysis
async function analyzeFarmerProfile(farmerId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const farmer = await getFarmer(farmerId);
  if (!farmer) {
    return { success: false, error: 'Farmer not found' };
  }
  
  // Analyze farmer characteristics
  const analysis = {
    farmerId,
    landCategory: categorizeLandSize(farmer.land_size),
    experienceLevel: categorizeExperience(farmer.farming_experience),
    skillDiversity: calculateSkillDiversity(farmer.skills),
    recommendationScore: calculateRecommendationScore(farmer),
    suggestedCrops: suggestCrops(farmer.land_size, farmer.primary_crop, farmer.skills),
    trainingNeeds: assessTrainingNeeds(farmer.skills, farmer.education),
    productivityPotential: estimateProductivityPotential(farmer)
  };
  
  return { success: true, data: analysis };
}

function categorizeLandSize(landSize) {
  if (!landSize) return 'unknown';
  if (landSize < 1) return 'small';
  if (landSize < 5) return 'medium';
  if (landSize < 10) return 'large';
  return 'very_large';
}

function categorizeExperience(experience) {
  if (!experience) return 'unknown';
  if (experience < 2) return 'beginner';
  if (experience < 5) return 'intermediate';
  if (experience < 10) return 'experienced';
  return 'expert';
}

function calculateSkillDiversity(skills) {
  if (!skills || skills.length === 0) return 0;
  const skillTypes = new Set(skills.map(s => s.type || s));
  return skillTypes.size;
}

function calculateRecommendationScore(farmer) {
  let score = 0;
  
  // Land size contribution
  if (farmer.land_size && farmer.land_size > 2) score += 20;
  
  // Experience contribution
  if (farmer.farming_experience && farmer.farming_experience > 3) score += 30;
  
  // Skills contribution
  if (farmer.skills && farmer.skills.length > 3) score += 25;
  
  // Education contribution
  if (farmer.education && farmer.education !== 'none') score += 15;
  
  // Primary crop contribution
  if (farmer.primary_crop) score += 10;
  
  return Math.min(score, 100);
}

function suggestCrops(landSize, primaryCrop, skills) {
  const crops = [];
  
  // Based on land size
  if (landSize < 2) {
    crops.push({ crop: 'vegetables', reason: 'Suitable for small land', priority: 'high' });
    crops.push({ crop: 'poultry', reason: 'High value per area', priority: 'medium' });
  } else if (landSize < 5) {
    crops.push({ crop: 'cereals', reason: 'Medium land suitable for cereals', priority: 'high' });
    crops.push({ crop: 'fruits', reason: 'Good for fruit orchards', priority: 'medium' });
  } else {
    crops.push({ crop: 'cash_crops', reason: 'Large land suitable for cash crops', priority: 'high' });
    crops.push({ crop: 'dairy', reason: 'Space for dairy operations', priority: 'medium' });
  }
  
  // Based on skills
  if (skills && skills.some(s => s.includes('organic'))) {
    crops.push({ crop: 'organic_farming', reason: 'Farmer has organic skills', priority: 'high' });
  }
  
  return crops;
}

function assessTrainingNeeds(skills, education) {
  const needs = [];
  
  if (!skills || skills.length === 0) {
    needs.push({ type: 'basic_farming', priority: 'critical' });
  }
  
  if (!skills || !skills.some(s => s.includes('modern'))) {
    needs.push({ type: 'modern_techniques', priority: 'high' });
  }
  
  if (!skills || !skills.some(s => s.includes('sustainable'))) {
    needs.push({ type: 'sustainable_practices', priority: 'medium' });
  }
  
  if (education === 'none' || education === 'primary') {
    needs.push({ type: 'agricultural_science', priority: 'medium' });
  }
  
  return needs;
}

function estimateProductivityPotential(farmer) {
  let potential = 'medium';
  
  const score = calculateRecommendationScore(farmer);
  
  if (score >= 80) potential = 'high';
  else if (score >= 50) potential = 'medium';
  else potential = 'low';
  
  return potential;
}

// Farmer verification
async function verifyFarmer(farmerId, verificationData) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { documents, identityProof, landProof } = verificationData;
  
  // Store verification data
  await pg.query(
    `INSERT INTO farmer_verifications (farmer_id, documents, identity_proof, land_proof, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'pending', NOW(), NOW())
     ON CONFLICT (farmer_id) DO UPDATE SET
       documents = EXCLUDED.documents,
       identity_proof = EXCLUDED.identity_proof,
       land_proof = EXCLUDED.land_proof,
       status = 'pending',
       updated_at = NOW()
     RETURNING *`,
    [farmerId, JSON.stringify(documents || []), JSON.stringify(identityProof), JSON.stringify(landProof)]
  );
  
  // Emit signal for verification request
  signalBus.emitSignal(SIGNAL.WORKFLOW_STARTED, {
    entityType: 'farmer_verification',
    farmerId,
    action: 'verification_requested'
  }, {
    severity: SEVERITY.INFO,
    source: 'farmer_registration_service',
    entityId: farmerId
  });
  
  return { success: true, message: 'Verification submitted for review' };
}

async function approveFarmerVerification(farmerId, approved, approvedBy, notes) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  await pg.query(
    `UPDATE farmer_verifications 
     SET status = $1, approved_by = $2, notes = $3, approved_at = NOW(), updated_at = NOW()
     WHERE farmer_id = $4`,
    [approved ? 'approved' : 'rejected', approvedBy, notes, farmerId]
  );
  
  // Update farmer status if approved
  if (approved) {
    await pg.query('UPDATE farmers SET status = $1, verified = true, updated_at = NOW() WHERE id = $2', ['verified', farmerId]);
  }
  
  // Emit signal for verification completion
  signalBus.emitSignal(SIGNAL.WORKFLOW_STARTED, {
    entityType: 'farmer_verification',
    farmerId,
    action: approved ? 'approved' : 'rejected',
    approvedBy
  }, {
    severity: approved ? SEVERITY.INFO : SEVERITY.WARNING,
    source: 'farmer_registration_service',
    entityId: farmerId
  });
  
  return { success: true };
}

// Farmer onboarding workflow
async function initiateOnboarding(farmerId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const farmer = await getFarmer(farmerId);
  if (!farmer) {
    return { success: false, error: 'Farmer not found' };
  }
  
  // Create onboarding checklist
  const checklist = [
    { task: 'complete_profile', status: 'pending', priority: 'high' },
    { task: 'upload_documents', status: 'pending', priority: 'high' },
    { task: 'verify_identity', status: 'pending', priority: 'high' },
    { task: 'select_crops', status: 'pending', priority: 'medium' },
    { task: 'training_assessment', status: 'pending', priority: 'medium' },
    { task: 'setup_payment', status: 'pending', priority: 'low' }
  ];
  
  await pg.query(
    `INSERT INTO farmer_onboarding (farmer_id, checklist, current_step, status, created_at, updated_at)
     VALUES ($1, $2, 1, 'in_progress', NOW(), NOW())
     ON CONFLICT (farmer_id) DO UPDATE SET
       checklist = EXCLUDED.checklist,
       current_step = 1,
       status = 'in_progress',
       updated_at = NOW()`,
    [farmerId, JSON.stringify(checklist)]
  );
  
  return { success: true, checklist };
}

async function updateOnboardingProgress(farmerId, stepIndex, stepData) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const onboardingRes = await pg.query('SELECT * FROM farmer_onboarding WHERE farmer_id = $1', [farmerId]);
  
  if (onboardingRes.rows.length === 0) {
    return { success: false, error: 'Onboarding not found' };
  }
  
  const onboarding = onboardingRes.rows[0];
  const checklist = onboarding.checklist || [];
  
  // Update checklist item
  if (checklist[stepIndex]) {
    checklist[stepIndex].status = 'completed';
    checklist[stepIndex].completedAt = new Date().toISOString();
    checklist[stepIndex].data = stepData;
  }
  
  // Move to next step
  const nextStep = stepIndex + 1;
  const isComplete = nextStep >= checklist.length;
  
  await pg.query(
    `UPDATE farmer_onboarding 
     SET checklist = $1, current_step = $2, status = $3, updated_at = NOW()
     WHERE farmer_id = $4`,
    [JSON.stringify(checklist), nextStep, isComplete ? 'completed' : 'in_progress', farmerId]
  );
  
  return { success: true, currentStep: nextStep, isComplete, checklist };
}

// Farmer analytics
async function getFarmerAnalytics({ startDate, endDate, region } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let query = `
    SELECT 
      primary_crop,
      COUNT(*) as count,
      AVG(land_size) as avg_land_size,
      AVG(farming_experience) as avg_experience
    FROM farmers
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;
  
  if (startDate) {
    query += ` AND created_at >= $${paramIndex++}`;
    params.push(startDate);
  }
  if (endDate) {
    query += ` AND created_at <= $${paramIndex++}`;
    params.push(endDate);
  }
  
  query += ` GROUP BY primary_crop ORDER BY count DESC`;
  
  const res = await pg.query(query, params);
  
  return {
    byCrop: res.rows,
    totalFarmers: res.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
    recommendations: generateFarmerAnalyticsRecommendations(res.rows)
  };
}

function generateFarmerAnalyticsRecommendations(cropData) {
  const recommendations = [];
  
  const topCrop = cropData[0];
  if (topCrop) {
    recommendations.push({
      type: 'resource_allocation',
      message: `Highest concentration of farmers in ${topCrop.primary_crop}. Consider allocating more resources to this crop.`,
      priority: 'high'
    });
  }
  
  const lowExperienceCrops = cropData.filter(row => parseFloat(row.avg_experience) < 3);
  if (lowExperienceCrops.length > 0) {
    recommendations.push({
      type: 'training',
      message: `Farmers in ${lowExperienceCrops.map(c => c.primary_crop).join(', ')} have low experience. Consider targeted training programs.`,
      priority: 'medium'
    });
  }
  
  return recommendations;
}

module.exports = {
  // Farmer CRUD
  registerFarmer,
  getFarmer,
  getFarmerByEmail,
  listFarmers,
  updateFarmer,
  
  // AI-powered analysis
  analyzeFarmerProfile,
  
  // Verification
  verifyFarmer,
  approveFarmerVerification,
  
  // Onboarding
  initiateOnboarding,
  updateOnboardingProgress,
  
  // Analytics
  getFarmerAnalytics,
};