// Service for Profile Management (M019) - AI Enhanced
// Comprehensive profile management with AI-powered completion and social integration
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { signalBus, SIGNAL, SEVERITY } = require('../../core/signalBus');

// Profile CRUD operations
async function createProfile(profileData) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { userId, firstName, lastName, displayName, bio, avatarUrl, location, website, socialLinks, preferences } = profileData;
  
  const res = await pg.query(
    `INSERT INTO user_profiles (user_id, first_name, last_name, display_name, bio, avatar_url, location, website, social_links, preferences, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       first_name = COALESCE(EXCLUDED.first_name, user_profiles.first_name),
       last_name = COALESCE(EXCLUDED.last_name, user_profiles.last_name),
       display_name = COALESCE(EXCLUDED.display_name, user_profiles.display_name),
       bio = COALESCE(EXCLUDED.bio, user_profiles.bio),
       avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
       location = COALESCE(EXCLUDED.location, user_profiles.location),
       website = COALESCE(EXCLUDED.website, user_profiles.website),
       social_links = COALESCE(EXCLUDED.social_links, user_profiles.social_links),
       preferences = COALESCE(EXCLUDED.preferences, user_profiles.preferences),
       updated_at = NOW()
     RETURNING *`,
    [userId, firstName, lastName, displayName, bio, avatarUrl, location, website, JSON.stringify(socialLinks || {}), JSON.stringify(preferences || {})]
  );
  
  // Emit signal
  signalBus.emitSignal(SIGNAL.ORGANIZATION_CREATED, {
    entityType: 'user_profile',
    profileId: res.rows[0].id,
    userId
  }, {
    severity: SEVERITY.INFO,
    source: 'profile_management_service',
    entityId: res.rows[0].id
  });
  
  return res.rows[0];
}

async function getProfile(userId) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let res = await pg.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
  return res.rows[0] || null;
}

async function updateProfile(userId, updates) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { firstName, lastName, displayName, bio, avatarUrl, location, website, socialLinks, preferences } = updates;
  
  let res = await pg.query(
    `UPDATE user_profiles 
     SET first_name = COALESCE($1, first_name),
         last_name = COALESCE($2, last_name),
         display_name = COALESCE($3, display_name),
         bio = COALESCE($4, bio),
         avatar_url = COALESCE($5, avatar_url),
         location = COALESCE($6, location),
         website = COALESCE($7, website),
         social_links = COALESCE($8, social_links),
         preferences = COALESCE($9, preferences),
         updated_at = NOW()
     WHERE user_id = $10
     RETURNING *`,
    [firstName, lastName, displayName, bio, avatarUrl, location, website, socialLinks ? JSON.stringify(socialLinks) : null, preferences ? JSON.stringify(preferences) : null, userId]
  );
  
  // Emit signal for profile update
  signalBus.emitSignal(SIGNAL.ORGANIZATION_UPDATED, {
    entityType: 'user_profile',
    userId,
    action: 'updated'
  }, {
    severity: SEVERITY.INFO,
    source: 'profile_management_service',
    entityId: userId
  });
  
  return res.rows[0] || null;
}

async function deleteProfile(userId) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let res = await pg.query('DELETE FROM user_profiles WHERE user_id = $1 RETURNING id', [userId]);
  return !!res.rows[0];
}

// Profile enrichment
async function enrichProfile(userId, enrichmentData) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const existingProfile = await getProfile(userId);
  if (!existingProfile) {
    return { success: false, error: 'Profile not found' };
  }
  
  // Merge enrichment data with existing profile
  const enrichedProfile = {
    ...existingProfile,
    ...enrichmentData,
    social_links: { ...existingProfile.social_links, ...enrichmentData.social_links }
  };
  
  return await updateProfile(userId, enrichedProfile);
}

// AI-powered profile completion
async function suggestProfileCompletion(userId) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const profile = await getProfile(userId);
  if (!profile) {
    return { success: false, error: 'Profile not found' };
  }
  
  const suggestions = [];
  let completionScore = 100;
  
  // Check for missing fields
  if (!profile.first_name) {
    suggestions.push({ field: 'first_name', priority: 'high', suggestion: 'Add your first name' });
    completionScore -= 10;
  }
  if (!profile.last_name) {
    suggestions.push({ field: 'last_name', priority: 'high', suggestion: 'Add your last name' });
    completionScore -= 10;
  }
  if (!profile.display_name) {
    suggestions.push({ field: 'display_name', priority: 'medium', suggestion: 'Create a display name' });
    completionScore -= 5;
  }
  if (!profile.bio) {
    suggestions.push({ field: 'bio', priority: 'medium', suggestion: 'Add a bio to introduce yourself' });
    completionScore -= 10;
  }
  if (!profile.avatar_url) {
    suggestions.push({ field: 'avatar_url', priority: 'medium', suggestion: 'Upload a profile picture' });
    completionScore -= 15;
  }
  if (!profile.location) {
    suggestions.push({ field: 'location', priority: 'low', suggestion: 'Add your location' });
    completionScore -= 5;
  }
  if (!profile.website) {
    suggestions.push({ field: 'website', priority: 'low', suggestion: 'Add your website or portfolio' });
    completionScore -= 5;
  }
  
  // Check social links
  const socialLinks = profile.social_links || {};
  if (!socialLinks.linkedin) {
    suggestions.push({ field: 'social_links.linkedin', priority: 'low', suggestion: 'Add your LinkedIn profile' });
    completionScore -= 5;
  }
  if (!socialLinks.twitter) {
    suggestions.push({ field: 'social_links.twitter', priority: 'low', suggestion: 'Add your Twitter handle' });
    completionScore -= 5;
  }
  
  return {
    userId,
    completionScore: Math.max(0, completionScore),
    completionLevel: completionScore >= 80 ? 'complete' : completionScore >= 50 ? 'partial' : 'minimal',
    suggestions,
    totalSuggestions: suggestions.length
  };
}

// Social media integration
async function linkSocialAccount(userId, platform, accountData) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let profile = await getProfile(userId);
  if (!profile) {
    return { success: false, error: 'Profile not found' };
  }
  
  let socialLinks = profile.social_links || {};
  socialLinks[platform] = accountData;
  
  await updateProfile(userId, { social_links: socialLinks });
  
  // Emit signal
  signalBus.emitSignal(SIGNAL.ORGANIZATION_UPDATED, {
    entityType: 'social_link',
    userId,
    platform,
    action: 'linked'
  }, {
    severity: SEVERITY.INFO,
    source: 'profile_management_service',
    entityId: userId
  });
  
  return { success: true, socialLinks };
}

async function unlinkSocialAccount(userId, platform) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let profile = await getProfile(userId);
  if (!profile) {
    return { success: false, error: 'Profile not found' };
  }
  
  let socialLinks = profile.social_links || {};
  delete socialLinks[platform];
  
  await updateProfile(userId, { socialLinks });
  
  return { success: true, socialLinks };
}

// Profile visibility controls
async function setProfileVisibility(userId, visibilitySettings) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let profile = await getProfile(userId);
  if (!profile) {
    return { success: false, error: 'Profile not found' };
  }
  
  const preferences = profile.preferences || {};
  preferences.visibility = visibilitySettings;
  
  await updateProfile(userId, { preferences });
  
  return { success: true, visibility: visibilitySettings };
}

async function getProfileVisibility(userId) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let profile = await getProfile(userId);
  if (!profile) {
    return { success: false, error: 'Profile not found' };
  }
  
  return {
    success: true,
    visibility: profile.preferences?.visibility || {
      profile: 'public',
      email: 'private',
      location: 'friends',
      bio: 'public'
    }
  };
}

// Profile activity tracking
async function logProfileActivity(userId, activityType, details) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  await pg.query(
    `INSERT INTO profile_activity (user_id, activity_type, details, created_at)
     VALUES ($1, $2, $3, NOW())`,
    [userId, activityType, JSON.stringify(details)]
  );
}

async function getProfileActivity(userId, { limit = 20 } = {}) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let res = await pg.query(
    `SELECT * FROM profile_activity 
     WHERE user_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2`,
    [userId, limit]
  );
  
  return res.rows;
}

// Profile search and discovery
async function searchProfiles(searchCriteria) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { query, location, skills, limit = 20 } = searchCriteria;
  
  let sql = `
    SELECT up.*, u.email, u.role 
    FROM user_profiles up
    JOIN users u ON up.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;
  
  if (query) {
    sql += ` AND (up.first_name ILIKE $${paramIndex++} OR up.last_name ILIKE $${paramIndex++} OR up.display_name ILIKE $${paramIndex++} OR up.bio ILIKE $${paramIndex++})`;
    const searchPattern = `%${query}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }
  
  if (location) {
    sql += ` AND up.location ILIKE $${paramIndex++}`;
    params.push(`%${location}%`);
  }
  
  sql += ` ORDER BY up.updated_at DESC LIMIT $${paramIndex++}`;
  params.push(limit);
  
  let res = await pg.query(sql, params);
  return res.rows;
}

// Profile recommendations
async function getProfileRecommendations(userId) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const userProfile = await getProfile(userId);
  if (!userProfile) {
    return { success: false, error: 'Profile not found' };
  }
  
  // Find users with similar interests or location
  const recommendations = await pg.query(
    `SELECT up.*, u.email, u.role 
     FROM user_profiles up
     JOIN users u ON up.user_id = u.id
     WHERE up.user_id != $1
     AND (up.location = $2 OR up.bio ILIKE $3)
     ORDER BY up.updated_at DESC
     LIMIT 10`,
    [userId, userProfile.location, `%${userProfile.bio?.substring(0, 50)}%`]
  );
  
  return {
    success: true,
    recommendations: recommendations.rows,
    total: recommendations.rows.length
  };
}

// Profile analytics
async function getProfileAnalytics(userId) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  // Get profile views
  const views = await pg.query(
    `SELECT COUNT(*) as count, DATE(created_at) as date
     FROM profile_views
     WHERE profile_user_id = $1 AND created_at > NOW() - INTERVAL '30 days'
     GROUP BY DATE(created_at)
     ORDER BY date DESC`,
    [userId]
  );
  
  // Get profile activity
  const activity = await pg.query(
    `SELECT activity_type, COUNT(*) as count
     FROM profile_activity
     WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'
     GROUP BY activity_type
     ORDER BY count DESC`,
    [userId]
  );
  
  // Get profile completion
  const completion = await suggestProfileCompletion(userId);
  
  return {
    userId,
    views: {
      total: views.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
      daily: views.rows
    },
    activity: activity.rows,
    completion: completion.completionScore,
    engagementScore: calculateEngagementScore(views.rows, activity.rows)
  };
}

function calculateEngagementScore(views, activity) {
  const totalViews = views.reduce((sum, row) => sum + parseInt(row.count), 0);
  const totalActivity = activity.reduce((sum, row) => sum + parseInt(row.count), 0);
  
  let score = 0;
  score += Math.min(totalViews / 10, 50); // Up to 50 points for views
  score += Math.min(totalActivity / 5, 50); // Up to 50 points for activity
  
  return Math.min(score, 100);
}

// Bulk profile operations
async function bulkUpdateProfiles(updates) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const results = [];
  
  for (const update of updates) {
    try {
      let profile = await updateProfile(update.userId, update.updates);
      results.push({ success: true, userId: update.userId, profile });
    } catch (error) {
      results.push({ success: false, userId: update.userId, error: error.message });
    }
  }
  
  return {
    total: updates.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results
  };
}

module.exports = {
  // Profile CRUD
  createProfile,
  getProfile,
  updateProfile,
  deleteProfile,
  
  // Profile enrichment
  enrichProfile,
  
  // AI-powered completion
  suggestProfileCompletion,
  
  // Social media integration
  linkSocialAccount,
  unlinkSocialAccount,
  
  // Visibility controls
  setProfileVisibility,
  getProfileVisibility,
  
  // Activity tracking
  logProfileActivity,
  getProfileActivity,
  
  // Search and discovery
  searchProfiles,
  getProfileRecommendations,
  
  // Analytics
  getProfileAnalytics,
  
  // Bulk operations
  bulkUpdateProfiles,
};