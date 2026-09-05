/**
 * Farmer Profile Service (M022)
 * Comprehensive farmer profile management with AI-powered enrichment and completeness analysis
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/legacy/aiService');
const pool = require('../../database/pool');

/**
 * Create farmer profile
 */
async function createProfile(profileData) {
  try {
    const {
      farmer_id,
      first_name,
      last_name,
      date_of_birth,
      gender,
      marital_status,
      nationality,
      language,
      education_level,
      occupation,
      annual_income,
      household_size,
      dependents
    } = profileData;

    const profile = {
      profile_id: generateId(),
      farmer_id,
      first_name,
      last_name,
      date_of_birth,
      gender,
      marital_status,
      nationality,
      language,
      education_level,
      occupation,
      annual_income,
      household_size,
      dependents,
      profile_completeness: calculateCompleteness(profileData),
      verification_status: 'pending',
      created_at: new Date().toISOString()
    };

    // AI-powered profile analysis
    const aiRequest = {
      task: 'farmer_profile_analysis',
      parameters: {
        profile_data: profileData,
        demographic_patterns: await getDemographicPatterns(),
        regional_characteristics: await getRegionalCharacteristics(profileData.state),
        profile_enrichment_suggestions: await generateEnrichmentSuggestions(profileData)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    profile.ai_recommendations = aiResponse;

    const result = await pool.query(
      `INSERT INTO farmer_profiles 
       (profile_id, farmer_id, first_name, last_name, date_of_birth, gender, 
        marital_status, nationality, language, education_level, occupation, 
        annual_income, household_size, dependents, profile_completeness, 
        verification_status, ai_recommendations, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING *`,
      [
        profile.profile_id,
        profile.farmer_id,
        profile.first_name,
        profile.last_name,
        profile.date_of_birth,
        profile.gender,
        profile.marital_status,
        profile.nationality,
        profile.language,
        profile.education_level,
        profile.occupation,
        profile.annual_income,
        profile.household_size,
        profile.dependents,
        profile.profile_completeness,
        profile.verification_status,
        JSON.stringify(profile.ai_recommendations),
        profile.created_at
      ]
    );

    logger.info(`Farmer profile created: ${profile.profile_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating farmer profile', { error: error.message, stack: error.stack });
    throw new Error('Failed to create farmer profile');
  }
}

/**
 * Get farmer profile
 */
async function getProfile(profileId) {
  try {
    let result = await pool.query(
      'SELECT * FROM farmer_profiles WHERE profile_id = $1',
      [profileId]
    );
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error getting farmer profile', { error: error.message });
    throw new Error('Failed to get farmer profile');
  }
}

/**
 * Get profile by farmer ID
 */
async function getProfileByFarmerId(farmerId) {
  try {
    let result = await pool.query(
      'SELECT * FROM farmer_profiles WHERE farmer_id = $1',
      [farmerId]
    );
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error getting profile by farmer ID', { error: error.message });
    throw new Error('Failed to get profile by farmer ID');
  }
}

/**
 * List farmer profiles
 */
async function listProfiles({ page = 1, limit = 20, verificationStatus, minCompleteness } = {}) {
  try {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM farmer_profiles WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (verificationStatus) {
      query += ` AND verification_status = $${paramIndex++}`;
      params.push(verificationStatus);
    }
    if (minCompleteness) {
      query += ` AND profile_completeness >= $${paramIndex++}`;
      params.push(minCompleteness);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const res = await pool.query(query, params);
    const totalRes = await pool.query(
      query.replace(`SELECT * FROM farmer_profiles`, 'SELECT COUNT(*) FROM farmer_profiles').split('LIMIT')[0],
      params.slice(0, -2)
    );
    const total = parseInt(totalRes.rows[0].count || '0');

    return { items: res.rows, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } };
  } catch (error) {
    logger.error('Error listing farmer profiles', { error: error.message });
    throw new Error('Failed to list farmer profiles');
  }
}

/**
 * Update farmer profile
 */
async function updateProfile(profileId, updates) {
  try {
    const {
      first_name,
      last_name,
      date_of_birth,
      gender,
      marital_status,
      nationality,
      language,
      education_level,
      occupation,
      annual_income,
      household_size,
      dependents,
      verification_status
    } = updates;

    const currentProfile = await getProfile(profileId);
    if (!currentProfile) {
      throw new Error('Profile not found');
    }

    const updatedData = { ...currentProfile, ...updates };
    updatedData.profile_completeness = calculateCompleteness(updatedData);
    updatedData.updated_at = new Date().toISOString();

    // Log enrichment
    if (first_name !== currentProfile.first_name) {
      await logEnrichment(profileId, 'update', 'first_name', currentProfile.first_name, first_name, 'manual');
    }

    let result = await pool.query(
      `UPDATE farmer_profiles 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           date_of_birth = COALESCE($3, date_of_birth),
           gender = COALESCE($4, gender),
           marital_status = COALESCE($5, marital_status),
           nationality = COALESCE($6, nationality),
           language = COALESCE($7, language),
           education_level = COALESCE($8, education_level),
           occupation = COALESCE($9, occupation),
           annual_income = COALESCE($10, annual_income),
           household_size = COALESCE($11, household_size),
           dependents = COALESCE($12, dependents),
           verification_status = COALESCE($13, verification_status),
           profile_completeness = $14,
           updated_at = CURRENT_TIMESTAMP
       WHERE profile_id = $15
       RETURNING *`,
      [
        first_name, last_name, date_of_birth, gender, marital_status,
        nationality, language, education_level, occupation, annual_income,
        household_size, dependents, verification_status,
        updatedData.profile_completeness, profileId
      ]
    );

    logger.info(`Farmer profile updated: ${profileId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error updating farmer profile', { error: error.message, stack: error.stack });
    throw new Error('Failed to update farmer profile');
  }
}

/**
 * Add contact information
 */
async function addContactInfo(profileId, contactData) {
  try {
    const {
      phone,
      alternate_phone,
      email,
      address_line1,
      address_line2,
      city,
      district,
      state,
      postal_code,
      country,
      is_primary
    } = contactData;

    const contact = {
      contact_id: generateId(),
      profile_id: profileId,
      phone,
      alternate_phone,
      email,
      address_line1,
      address_line2,
      city,
      district,
      state,
      postal_code,
      country: country || 'India',
      is_primary: is_primary || false,
      created_at: new Date().toISOString()
    };

    let result = await pool.query(
      `INSERT INTO farmer_contact_info 
       (contact_id, profile_id, phone, alternate_phone, email, address_line1, 
        address_line2, city, district, state, postal_code, country, is_primary, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        contact.contact_id, contact.profile_id, contact.phone, contact.alternate_phone,
        contact.email, contact.address_line1, contact.address_line2, contact.city,
        contact.district, contact.state, contact.postal_code, contact.country,
        contact.is_primary, contact.created_at
      ]
    );

    logger.info(`Contact info added: ${contact.contact_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error adding contact info', { error: error.message, stack: error.stack });
    throw new Error('Failed to add contact info');
  }
}

/**
 * Add household member
 */
async function addHouseholdMember(profileId, memberData) {
  try {
    const {
      member_name,
      relationship,
      age,
      gender,
      education,
      occupation,
      income_contribution,
      is_working_on_farm
    } = memberData;

    const member = {
      household_id: generateId(),
      profile_id: profileId,
      member_name,
      relationship,
      age,
      gender,
      education,
      occupation,
      income_contribution,
      is_working_on_farm: is_working_on_farm || false,
      created_at: new Date().toISOString()
    };

    let result = await pool.query(
      `INSERT INTO farmer_household 
       (household_id, profile_id, member_name, relationship, age, gender, 
        education, occupation, income_contribution, is_working_on_farm, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        member.household_id, member.profile_id, member.member_name, member.relationship,
        member.age, member.gender, member.education, member.occupation,
        member.income_contribution, member.is_working_on_farm, member.created_at
      ]
    );

    logger.info(`Household member added: ${member.household_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error adding household member', { error: error.message, stack: error.stack });
    throw new Error('Failed to add household member');
  }
}

/**
 * Add skill
 */
async function addSkill(profileId, skillData) {
  try {
    const {
      skill_name,
      skill_category,
      proficiency_level,
      years_experience,
      certification,
      certification_date
    } = skillData;

    const skill = {
      skill_id: generateId(),
      profile_id: profileId,
      skill_name,
      skill_category,
      proficiency_level,
      years_experience,
      certification,
      certification_date,
      created_at: new Date().toISOString()
    };

    let result = await pool.query(
      `INSERT INTO farmer_skills 
       (skill_id, profile_id, skill_name, skill_category, proficiency_level, 
        years_experience, certification, certification_date, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        skill.skill_id, skill.profile_id, skill.skill_name, skill.skill_category,
        skill.proficiency_level, skill.years_experience, skill.certification,
        skill.certification_date, skill.created_at
      ]
    );

    logger.info(`Skill added: ${skill.skill_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error adding skill', { error: error.message, stack: error.stack });
    throw new Error('Failed to add skill');
  }
}

/**
 * AI-powered profile enrichment
 */
async function enrichProfile(profileId) {
  try {
    let profile = await getProfile(profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    let aiRequest = {
      task: 'profile_enrichment',
      parameters: {
        profile_data: profile,
        missing_fields: identifyMissingFields(profile),
        demographic_data: await getDemographicData(profile.state, profile.district),
        regional_patterns: await getRegionalPatterns(profile.state),
        similar_profiles: await getSimilarProfiles(profile)
      }
    };

    let aiResponse = await aiAPI.generateRecommendation(aiRequest);

    // Apply AI recommendations
    const enrichmentResults = [];
    for (const recommendation of aiResponse.recommendations || []) {
      if (recommendation.confidence > 0.8) {
        enrichmentResults.push({
          field: recommendation.field,
          suggested_value: recommendation.value,
          confidence: recommendation.confidence,
          applied: true
        });

        await logEnrichment(
          profileId,
          'ai_enrichment',
          recommendation.field,
          null,
          recommendation.value,
          'ai_service'
        );
      }
    }

    logger.info(`Profile enriched: ${profileId}`);
    return {
      profile_id: profileId,
      enrichment_results: enrichmentResults,
      ai_recommendations: aiResponse
    };
  } catch (error) {
    logger.error('Error enriching profile', { error: error.message, stack: error.stack });
    throw new Error('Failed to enrich profile');
  }
}

/**
 * Analyze profile completeness
 */
async function analyzeProfileCompleteness(profileId) {
  try {
    let profile = await getProfile(profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    const analysis = {
      profile_id: profileId,
      completeness_score: profile.profile_completeness,
      missing_fields: identifyMissingFields(profile),
      required_fields: getRequiredFields(),
      optional_fields: getOptionalFields(),
      suggestions: generateCompletenessSuggestions(profile),
      estimated_completion_time: estimateCompletionTime(profile)
    };

    return analysis;
  } catch (error) {
    logger.error('Error analyzing profile completeness', { error: error.message, stack: error.stack });
    throw new Error('Failed to analyze profile completeness');
  }
}

/**
 * Get full profile with all related data
 */
async function getFullProfile(profileId) {
  try {
    let profile = await getProfile(profileId);
    if (!profile) {
      return null;
    }

    const contacts = await pool.query(
      'SELECT * FROM farmer_contact_info WHERE profile_id = $1',
      [profileId]
    );

    const household = await pool.query(
      'SELECT * FROM farmer_household WHERE profile_id = $1',
      [profileId]
    );

    const education = await pool.query(
      'SELECT * FROM farmer_education WHERE profile_id = $1',
      [profileId]
    );

    const skills = await pool.query(
      'SELECT * FROM farmer_skills WHERE profile_id = $1',
      [profileId]
    );

    return {
      profile,
      contacts: contacts.rows,
      household: household.rows,
      education: education.rows,
      skills: skills.rows
    };
  } catch (error) {
    logger.error('Error getting full profile', { error: error.message, stack: error.stack });
    throw new Error('Failed to get full profile');
  }
}

// Helper functions
function generateId() {
  return `FP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function calculateCompleteness(profileData) {
  const requiredFields = [
    'first_name', 'last_name', 'date_of_birth', 'gender',
    'education_level', 'household_size'
  ];
  const optionalFields = [
    'marital_status', 'nationality', 'language', 'occupation',
    'annual_income', 'dependents'
  ];

  let requiredCount = 0;
  let optionalCount = 0;

  requiredFields.forEach(field => {
    if (profileData[field]) requiredCount++;
  });

  optionalFields.forEach(field => {
    if (profileData[field]) optionalCount++;
  });

  const requiredScore = (requiredCount / requiredFields.length) * 70;
  const optionalScore = (optionalCount / optionalFields.length) * 30;

  return Math.round(requiredScore + optionalScore);
}

function identifyMissingFields(profile) {
  const allFields = [
    'first_name', 'last_name', 'date_of_birth', 'gender',
    'marital_status', 'nationality', 'language', 'education_level',
    'occupation', 'annual_income', 'household_size', 'dependents'
  ];

  return allFields.filter(field => !profile[field]);
}

function getRequiredFields() {
  return [
    'first_name', 'last_name', 'date_of_birth', 'gender',
    'education_level', 'household_size'
  ];
}

function getOptionalFields() {
  return [
    'marital_status', 'nationality', 'language', 'occupation',
    'annual_income', 'dependents'
  ];
}

function generateCompletenessSuggestions(profile) {
  const suggestions = [];
  const missing = identifyMissingFields(profile);

  if (missing.includes('marital_status')) {
    suggestions.push({ field: 'marital_status', message: 'Add marital status for better demographic analysis' });
  }
  if (missing.includes('occupation')) {
    suggestions.push({ field: 'occupation', message: 'Add occupation for income assessment' });
  }
  if (missing.includes('annual_income')) {
    suggestions.push({ field: 'annual_income', message: 'Add annual income for subsidy eligibility' });
  }

  return suggestions;
}

function estimateCompletionTime(profile) {
  const missingCount = identifyMissingFields(profile).length;
  return `${Math.ceil(missingCount * 2)} minutes`;
}

async function getDemographicPatterns() {
  return {
    common_occupations: ['farming', 'agricultural_labor', 'small_business'],
    common_education_levels: ['primary', 'secondary', 'higher_secondary'],
    average_household_size: 5
  };
}

async function getRegionalCharacteristics(state) {
  return {
    common_crops: ['wheat', 'rice', 'vegetables'],
    language_distribution: { hindi: 0.6, regional: 0.4 },
    education_index: 0.7
  };
}

const REGIONAL_LANGUAGE_DEFAULTS = {
  assam: 'assamese', meghalaya: 'khasi', tripura: 'bengali',
  manipur: 'manipuri', mizoram: 'mizo', nagaland: 'english',
  'arunachal pradesh': 'hindi', sikkim: 'nepali'
};

// Honest-degradation pattern (matches services/dual-use/platformCoreService.js):
// suggestions are derived from the fields actually missing on profileData and
// from whatever regional signal profileData provides, not a fixed constant.
// Any suggestion without a real per-farmer signal is labeled source: 'static'
// instead of carrying a fabricated confidence score.
async function generateEnrichmentSuggestions(profileData) {
  let profile = profileData || {};
  let missing = identifyMissingFields(profile);
  let suggestions = [];

  if (missing.includes('occupation')) {
    suggestions.push({
      field: 'occupation',
      suggested_value: 'farming',
      source: 'static',
      reason: 'Most common occupation among registered farmer profiles; no per-farmer signal available'
    });
  }

  if (missing.includes('language')) {
    const state = String(profile.state || '').trim().toLowerCase();
    const regionalDefault = REGIONAL_LANGUAGE_DEFAULTS[state];
    suggestions.push({
      field: 'language',
      suggested_value: regionalDefault || 'hindi',
      source: regionalDefault ? 'regional_default' : 'static',
      reason: regionalDefault
        ? `Default language for ${profile.state}`
        : 'No matching state on file; falling back to national default'
    });
  }

  return suggestions;
}

async function getDemographicData(state, district) {
  return {
    population_density: 500,
    literacy_rate: 0.75,
    main_occupation: 'agriculture'
  };
}

async function getRegionalPatterns(state) {
  return {
    farming_practices: ['traditional', 'mixed'],
    common_crops: ['rice', 'wheat'],
    irrigation_methods: ['canal', 'groundwater']
  };
}

async function getSimilarProfiles(profile) {
  try {
    let result = await pool.query(
      `SELECT * FROM farmer_profiles 
       WHERE state = $1 AND education_level = $2 
       LIMIT 5`,
      [profile.state, profile.education_level]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function logEnrichment(profileId, enrichmentType, fieldName, previousValue, newValue, source) {
  try {
    await pool.query(
      `INSERT INTO profile_enrichment_log 
       (profile_id, enrichment_type, field_name, previous_value, new_value, enrichment_source, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      [profileId, enrichmentType, fieldName, previousValue, newValue, source]
    );
  } catch (error) {
    logger.error('Error logging enrichment', { error: error.message });
  }
}

module.exports = {
  createProfile,
  getProfile,
  getProfileByFarmerId,
  listProfiles,
  updateProfile,
  addContactInfo,
  addHouseholdMember,
  addSkill,
  enrichProfile,
  analyzeProfileCompleteness,
  getFullProfile
};
