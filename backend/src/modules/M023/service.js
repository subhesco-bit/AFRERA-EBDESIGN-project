/**
 * Farmer Training Service (M023)
 * Comprehensive farmer training program management with AI-powered course recommendations
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/aiService');
const pool = require('../../database/pool');

/**
 * Create training program
 */
async function createTrainingProgram(programData) {
  try {
    const {
      program_name,
      program_code,
      category,
      subcategory,
      description,
      duration_hours,
      difficulty_level,
      prerequisites,
      learning_objectives,
      curriculum,
      instructor_id,
      language,
      target_audience,
      max_participants,
      certification_offered,
      certification_details
    } = programData;

    const program = {
      program_id: generateId(),
      program_name,
      program_code,
      category,
      subcategory,
      description,
      duration_hours,
      difficulty_level,
      prerequisites: prerequisites || [],
      learning_objectives: learning_objectives || [],
      curriculum: curriculum || [],
      instructor_id,
      language,
      target_audience: target_audience || [],
      max_participants,
      certification_offered: certification_offered || false,
      certification_details: certification_details || {},
      status: 'active',
      created_at: new Date().toISOString()
    };

    // AI-powered content analysis
    const aiRequest = {
      task: 'training_content_analysis',
      parameters: {
        program_data: programData,
        industry_standards: await getIndustryStandards(category),
        skill_requirements: await getSkillRequirements(category),
        learning_outcomes: await predictLearningOutcomes(programData)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    program.ai_content_analysis = aiResponse;

    const result = await pool.query(
      `INSERT INTO training_programs 
       (program_id, program_name, program_code, category, subcategory, description, 
        duration_hours, difficulty_level, prerequisites, learning_objectives, curriculum, 
        instructor_id, language, target_audience, max_participants, certification_offered, 
        certification_details, ai_content_analysis, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
       RETURNING *`,
      [
        program.program_id, program.program_name, program.program_code, program.category,
        program.subcategory, program.description, program.duration_hours, program.difficulty_level,
        JSON.stringify(program.prerequisites), JSON.stringify(program.learning_objectives),
        JSON.stringify(program.curriculum), program.instructor_id, program.language,
        JSON.stringify(program.target_audience), program.max_participants, program.certification_offered,
        JSON.stringify(program.certification_details), JSON.stringify(program.ai_content_analysis),
        program.status, program.created_at
      ]
    );

    logger.info(`Training program created: ${program.program_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating training program', { error: error.message, stack: error.stack });
    throw new Error('Failed to create training program');
  }
}

/**
 * Create training session
 */
async function createTrainingSession(sessionData) {
  try {
    const {
      program_id,
      session_name,
      start_date,
      end_date,
      location,
      location_type,
      district,
      state,
      instructor_id,
      schedule,
      max_participants,
      registration_deadline,
      materials_provided
    } = sessionData;

    const session = {
      session_id: generateId(),
      program_id,
      session_name,
      start_date,
      end_date,
      location,
      location_type,
      district,
      state,
      instructor_id,
      schedule: schedule || {},
      max_participants,
      current_participants: 0,
      status: 'scheduled',
      registration_deadline,
      materials_provided: materials_provided || [],
      created_at: new Date().toISOString()
    };

    const result = await pool.query(
      `INSERT INTO training_sessions 
       (session_id, program_id, session_name, start_date, end_date, location, 
        location_type, district, state, instructor_id, schedule, max_participants, 
        current_participants, status, registration_deadline, materials_provided, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [
        session.session_id, session.program_id, session.session_name, session.start_date,
        session.end_date, session.location, session.location_type, session.district,
        session.state, session.instructor_id, JSON.stringify(session.schedule),
        session.max_participants, session.current_participants, session.status,
        session.registration_deadline, JSON.stringify(session.materials_provided), session.created_at
      ]
    );

    logger.info(`Training session created: ${session.session_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating training session', { error: error.message, stack: error.stack });
    throw new Error('Failed to create training session');
  }
}

/**
 * Enroll farmer in training
 */
async function enrollFarmer(sessionId, farmerId) {
  try {
    // Check session availability
    const session = await pool.query(
      'SELECT * FROM training_sessions WHERE session_id = $1',
      [sessionId]
    );

    if (session.rows.length === 0) {
      throw new Error('Session not found');
    }

    const sessionData = session.rows[0];
    if (sessionData.current_participants >= sessionData.max_participants) {
      throw new Error('Session is full');
    }

    // Check if already enrolled
    const existingEnrollment = await pool.query(
      'SELECT * FROM farmer_enrollments WHERE session_id = $1 AND farmer_id = $2',
      [sessionId, farmerId]
    );

    if (existingEnrollment.rows.length > 0) {
      throw new Error('Farmer already enrolled');
    }

    const enrollment = {
      enrollment_id: generateId(),
      session_id: sessionId,
      farmer_id: farmerId,
      enrollment_date: new Date().toISOString().split('T')[0],
      enrollment_status: 'enrolled',
      attendance_percentage: 0,
      completion_percentage: 0,
      assessment_score: 0,
      certificate_issued: false,
      created_at: new Date().toISOString()
    };

    // AI-powered learning path
    const aiRequest = {
      task: 'learning_path_recommendation',
      parameters: {
        farmer_id: farmerId,
        session_id: sessionId,
        farmer_profile: await getFarmerProfile(farmerId),
        program_requirements: await getProgramRequirements(sessionData.program_id),
        learning_style: await assessLearningStyle(farmerId)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    enrollment.ai_learning_path = aiResponse;

    const result = await pool.query(
      `INSERT INTO farmer_enrollments 
       (enrollment_id, session_id, farmer_id, enrollment_date, enrollment_status, 
        attendance_percentage, completion_percentage, assessment_score, certificate_issued, 
        ai_learning_path, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        enrollment.enrollment_id, enrollment.session_id, enrollment.farmer_id,
        enrollment.enrollment_date, enrollment.enrollment_status, enrollment.attendance_percentage,
        enrollment.completion_percentage, enrollment.assessment_score, enrollment.certificate_issued,
        JSON.stringify(enrollment.ai_learning_path), enrollment.created_at
      ]
    );

    // Update session participant count
    await pool.query(
      'UPDATE training_sessions SET current_participants = current_participants + 1 WHERE session_id = $1',
      [sessionId]
    );

    logger.info(`Farmer enrolled: ${enrollment.enrollment_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error enrolling farmer', { error: error.message, stack: error.stack });
    throw new Error('Failed to enroll farmer');
  }
}

/**
 * Record attendance
 */
async function recordAttendance(sessionId, farmerId, attendanceData) {
  try {
    const { attendance_date, status, notes } = attendanceData;

    const attendance = {
      attendance_id: generateId(),
      session_id: sessionId,
      enrollment_id: await getEnrollmentId(sessionId, farmerId),
      farmer_id: farmerId,
      attendance_date,
      status,
      notes,
      created_at: new Date().toISOString()
    };

    const result = await pool.query(
      `INSERT INTO training_attendance 
       (attendance_id, session_id, enrollment_id, farmer_id, attendance_date, status, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        attendance.attendance_id, attendance.session_id, attendance.enrollment_id,
        attendance.farmer_id, attendance.attendance_date, attendance.status,
        attendance.notes, attendance.created_at
      ]
    );

    // Update enrollment attendance percentage
    await updateAttendancePercentage(attendance.enrollment_id);

    logger.info(`Attendance recorded: ${attendance.attendance_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error recording attendance', { error: error.message, stack: error.stack });
    throw new Error('Failed to record attendance');
  }
}

/**
 * Submit assessment
 */
async function submitAssessment(assessmentId, farmerId, answers) {
  try {
    const assessment = await pool.query(
      'SELECT * FROM training_assessments WHERE assessment_id = $1',
      [assessmentId]
    );

    if (assessment.rows.length === 0) {
      throw new Error('Assessment not found');
    }

    const assessmentData = assessment.rows[0];
    const enrollment = await getEnrollmentByFarmerAndProgram(farmerId, assessmentData.program_id);

    // Calculate score
    const score = calculateAssessmentScore(assessmentData.questions, answers);
    const percentage = (score / assessmentData.total_marks) * 100;
    const passed = percentage >= assessmentData.passing_score;

    const result = {
      result_id: generateId(),
      assessment_id: assessmentId,
      enrollment_id: enrollment.enrollment_id,
      farmer_id: farmerId,
      score,
      total_score: assessmentData.total_marks,
      percentage,
      passed,
      answers,
      time_taken_minutes: answers.time_taken_minutes || 0,
      attempted_at: new Date().toISOString()
    };

    // AI-powered performance analysis
    const aiRequest = {
      task: 'assessment_performance_analysis',
      parameters: {
        farmer_id: farmerId,
        assessment_data: assessmentData,
        answers: answers,
        performance_data: await getFarmerPerformanceHistory(farmerId),
        benchmark_data: await getAssessmentBenchmarks(assessmentId)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    result.ai_performance_analysis = aiResponse;

    const insertResult = await pool.query(
      `INSERT INTO assessment_results 
       (result_id, assessment_id, enrollment_id, farmer_id, score, total_score, 
        percentage, passed, answers, time_taken_minutes, attempted_at, ai_performance_analysis, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        result.result_id, result.assessment_id, result.enrollment_id, result.farmer_id,
        result.score, result.total_score, result.percentage, result.passed,
        JSON.stringify(result.answers), result.time_taken_minutes, result.attempted_at,
        JSON.stringify(result.ai_performance_analysis), result.created_at
      ]
    );

    // Update enrollment assessment score
    await pool.query(
      'UPDATE farmer_enrollments SET assessment_score = $1 WHERE enrollment_id = $2',
      [percentage, enrollment.enrollment_id]
    );

    // Issue certificate if passed and certification offered
    if (passed) {
      await issueCertificate(enrollment.enrollment_id);
    }

    logger.info(`Assessment submitted: ${result.result_id}`);
    return insertResult.rows[0];
  } catch (error) {
    logger.error('Error submitting assessment', { error: error.message, stack: error.stack });
    throw new Error('Failed to submit assessment');
  }
}

/**
 * Get AI-recommended training programs for farmer
 */
async function getRecommendedPrograms(farmerId) {
  try {
    const farmerProfile = await getFarmerProfile(farmerId);
    const farmerSkills = await getFarmerSkills(farmerId);
    const completedPrograms = await getCompletedPrograms(farmerId);

    const aiRequest = {
      task: 'training_program_recommendation',
      parameters: {
        farmer_profile: farmerProfile,
        farmer_skills: farmerSkills,
        completed_programs: completedPrograms,
        available_programs: await getAvailablePrograms(),
        industry_trends: await getIndustryTrends(),
        skill_gaps: await identifySkillGaps(farmerId)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);

    return {
      farmer_id: farmerId,
      recommendations: aiResponse.recommendations || [],
      reasoning: aiResponse.reasoning,
      confidence: aiResponse.confidence
    };
  } catch (error) {
    logger.error('Error getting recommended programs', { error: error.message, stack: error.stack });
    throw new Error('Failed to get recommended programs');
  }
}

/**
 * Get training analytics
 */
async function getTrainingAnalytics({ startDate, endDate, category, district } = {}) {
  try {
    const analytics = {
      period: { startDate, endDate },
      total_programs: await getTotalPrograms(category),
      total_sessions: await getTotalSessions(district, startDate, endDate),
      total_enrollments: await getTotalEnrollments(startDate, endDate),
      completion_rate: await getCompletionRate(startDate, endDate),
      average_assessment_score: await getAverageAssessmentScore(startDate, endDate),
      certification_rate: await getCertificationRate(startDate, endDate),
      attendance_rate: await getAttendanceRate(startDate, endDate),
      top_programs: await getTopPrograms(startDate, endDate),
      district_performance: await getDistrictPerformance(startDate, endDate),
      ai_insights: await generateTrainingInsights(startDate, endDate)
    };

    return analytics;
  } catch (error) {
    logger.error('Error getting training analytics', { error: error.message, stack: error.stack });
    throw new Error('Failed to get training analytics');
  }
}

// Helper functions
function generateId() {
  return `TR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function getIndustryStandards(category) {
  return {
    best_practices: ['hands_on_training', 'field_demonstrations'],
    required_hours: 20,
    certification_requirements: ['final_assessment', 'practical_exam']
  };
}

async function getSkillRequirements(category) {
  return {
    technical_skills: ['soil_management', 'crop_selection'],
    practical_skills: ['equipment_operation', 'safety_protocols'],
    knowledge_areas: ['pest_management', 'irrigation_techniques']
  };
}

async function predictLearningOutcomes(programData) {
  return {
    skill_improvement: 0.8,
    knowledge_gain: 0.75,
    practical_application: 0.7
  };
}

async function getFarmerProfile(farmerId) {
  try {
    const result = await pool.query(
      'SELECT * FROM farmer_profiles WHERE farmer_id = $1',
      [farmerId]
    );
    return result.rows[0] || {};
  } catch (error) {
    return {};
  }
}

async function getProgramRequirements(programId) {
  try {
    const result = await pool.query(
      'SELECT * FROM training_programs WHERE program_id = $1',
      [programId]
    );
    return result.rows[0] || {};
  } catch (error) {
    return {};
  }
}

async function assessLearningStyle(farmerId) {
  return {
    preferred_format: 'visual',
    learning_pace: 'moderate',
    interaction_level: 'high'
  };
}

async function getEnrollmentId(sessionId, farmerId) {
  try {
    const result = await pool.query(
      'SELECT enrollment_id FROM farmer_enrollments WHERE session_id = $1 AND farmer_id = $2',
      [sessionId, farmerId]
    );
    return result.rows[0]?.enrollment_id || null;
  } catch (error) {
    return null;
  }
}

async function updateAttendancePercentage(enrollmentId) {
  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'present') as present,
        COUNT(*) as total
       FROM training_attendance
       WHERE enrollment_id = $1`,
      [enrollmentId]
    );

    const attendance = result.rows[0];
    const percentage = attendance.total > 0 ? (attendance.present / attendance.total) * 100 : 0;

    await pool.query(
      'UPDATE farmer_enrollments SET attendance_percentage = $1 WHERE enrollment_id = $2',
      [percentage, enrollmentId]
    );
  } catch (error) {
    logger.error('Error updating attendance percentage', { error: error.message });
  }
}

async function getEnrollmentByFarmerAndProgram(farmerId, programId) {
  try {
    const result = await pool.query(
      `SELECT fe.* FROM farmer_enrollments fe
       JOIN training_sessions ts ON fe.session_id = ts.session_id
       WHERE fe.farmer_id = $1 AND ts.program_id = $2
       LIMIT 1`,
      [farmerId, programId]
    );
    return result.rows[0] || null;
  } catch (error) {
    return null;
  }
}

function calculateAssessmentScore(questions, answers) {
  let score = 0;
  questions.forEach((question, index) => {
    if (answers[index] === question.correct_answer) {
      score += question.marks;
    }
  });
  return score;
}

async function getFarmerPerformanceHistory(farmerId) {
  try {
    const result = await pool.query(
      'SELECT * FROM assessment_results WHERE farmer_id = $1 ORDER BY attempted_at DESC LIMIT 10',
      [farmerId]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function getAssessmentBenchmarks(assessmentId) {
  return {
    average_score: 75,
    top_score: 95,
    pass_rate: 0.8
  };
}

async function issueCertificate(enrollmentId) {
  try {
    const certificateId = generateId();
    await pool.query(
      `UPDATE farmer_enrollments 
       SET certificate_issued = true, certificate_id = $1, certificate_issue_date = CURRENT_DATE
       WHERE enrollment_id = $2`,
      [certificateId, enrollmentId]
    );
  } catch (error) {
    logger.error('Error issuing certificate', { error: error.message });
  }
}

async function getFarmerSkills(farmerId) {
  try {
    const result = await pool.query(
      'SELECT * FROM farmer_skills WHERE profile_id IN (SELECT profile_id FROM farmer_profiles WHERE farmer_id = $1)',
      [farmerId]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function getCompletedPrograms(farmerId) {
  try {
    const result = await pool.query(
      `SELECT tp.* FROM training_programs tp
       JOIN training_sessions ts ON tp.program_id = ts.program_id
       JOIN farmer_enrollments fe ON ts.session_id = fe.session_id
       WHERE fe.farmer_id = $1 AND fe.enrollment_status = 'completed'`,
      [farmerId]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function getAvailablePrograms() {
  try {
    const result = await pool.query(
      'SELECT * FROM training_programs WHERE status = $1',
      ['active']
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function getIndustryTrends() {
  return {
    emerging_topics: ['precision_farming', 'organic_certification'],
    in_demand_skills: ['soil_health_management', 'water_conservation']
  };
}

async function identifySkillGaps(farmerId) {
  return {
    technical_gaps: ['modern_irrigation', 'pest_management'],
    knowledge_gaps: ['market_trends', 'regulatory_compliance']
  };
}

async function getTotalPrograms(category) {
  try {
    let query = 'SELECT COUNT(*) as count FROM training_programs WHERE status = $1';
    const params = ['active'];
    if (category) {
      query += ' AND category = $2';
      params.push(category);
    }
    const result = await pool.query(query, params);
    return result.rows[0]?.count || 0;
  } catch (error) {
    return 0;
  }
}

async function getTotalSessions(district, startDate, endDate) {
  try {
    let query = 'SELECT COUNT(*) as count FROM training_sessions WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (district) {
      query += ` AND district = $${paramIndex++}`;
      params.push(district);
    }
    if (startDate) {
      query += ` AND start_date >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND end_date <= $${paramIndex++}`;
      params.push(endDate);
    }

    const result = await pool.query(query, params);
    return result.rows[0]?.count || 0;
  } catch (error) {
    return 0;
  }
}

async function getTotalEnrollments(startDate, endDate) {
  try {
    let query = 'SELECT COUNT(*) as count FROM farmer_enrollments WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (startDate) {
      query += ` AND enrollment_date >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND enrollment_date <= $${paramIndex++}`;
      params.push(endDate);
    }

    const result = await pool.query(query, params);
    return result.rows[0]?.count || 0;
  } catch (error) {
    return 0;
  }
}

async function getCompletionRate(startDate, endDate) {
  try {
    let query = `SELECT 
      COUNT(*) FILTER (WHERE enrollment_status = 'completed') as completed,
      COUNT(*) as total
     FROM farmer_enrollments WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (startDate) {
      query += ` AND enrollment_date >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND enrollment_date <= $${paramIndex++}`;
      params.push(endDate);
    }

    const result = await pool.query(query, params);
    const data = result.rows[0];
    return data.total > 0 ? (data.completed / data.total) * 100 : 0;
  } catch (error) {
    return 0;
  }
}

async function getAverageAssessmentScore(startDate, endDate) {
  try {
    let query = 'SELECT AVG(percentage) as avg_score FROM assessment_results WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (startDate) {
      query += ` AND attempted_at >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND attempted_at <= $${paramIndex++}`;
      params.push(endDate);
    }

    const result = await pool.query(query, params);
    return result.rows[0]?.avg_score || 0;
  } catch (error) {
    return 0;
  }
}

async function getCertificationRate(startDate, endDate) {
  try {
    let query = `SELECT 
      COUNT(*) FILTER (WHERE certificate_issued = true) as certified,
      COUNT(*) as total
     FROM farmer_enrollments WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (startDate) {
      query += ` AND enrollment_date >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND enrollment_date <= $${paramIndex++}`;
      params.push(endDate);
    }

    const result = await pool.query(query, params);
    const data = result.rows[0];
    return data.total > 0 ? (data.certified / data.total) * 100 : 0;
  } catch (error) {
    return 0;
  }
}

async function getAttendanceRate(startDate, endDate) {
  try {
    let query = `SELECT 
      COUNT(*) FILTER (WHERE status = 'present') as present,
      COUNT(*) as total
     FROM training_attendance WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (startDate) {
      query += ` AND attendance_date >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND attendance_date <= $${paramIndex++}`;
      params.push(endDate);
    }

    const result = await pool.query(query, params);
    const data = result.rows[0];
    return data.total > 0 ? (data.present / data.total) * 100 : 0;
  } catch (error) {
    return 0;
  }
}

async function getTopPrograms(startDate, endDate) {
  try {
    const result = await pool.query(
      `SELECT tp.program_name, COUNT(fe.enrollment_id) as enrollment_count
       FROM training_programs tp
       JOIN training_sessions ts ON tp.program_id = ts.program_id
       JOIN farmer_enrollments fe ON ts.session_id = fe.session_id
       WHERE fe.enrollment_date >= $1 AND fe.enrollment_date <= $2
       GROUP BY tp.program_name
       ORDER BY enrollment_count DESC
       LIMIT 5`,
      [startDate, endDate]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function getDistrictPerformance(startDate, endDate) {
  try {
    const result = await pool.query(
      `SELECT ts.district, COUNT(fe.enrollment_id) as enrollment_count,
        AVG(fe.assessment_score) as avg_score
       FROM training_sessions ts
       JOIN farmer_enrollments fe ON ts.session_id = fe.session_id
       WHERE fe.enrollment_date >= $1 AND fe.enrollment_date <= $2
       GROUP BY ts.district
       ORDER BY enrollment_count DESC`,
      [startDate, endDate]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function generateTrainingInsights(startDate, endDate) {
  const aiRequest = {
    task: 'training_analytics_insights',
    parameters: {
      period: { startDate, endDate },
      enrollment_data: await getTotalEnrollments(startDate, endDate),
      completion_data: await getCompletionRate(startDate, endDate),
      performance_data: await getAverageAssessmentScore(startDate, endDate)
    }
  };

  const aiResponse = await aiAPI.generateRecommendation(aiRequest);
  return aiResponse;
}

module.exports = {
  createTrainingProgram,
  createTrainingSession,
  enrollFarmer,
  recordAttendance,
  submitAssessment,
  getRecommendedPrograms,
  getTrainingAnalytics
};
