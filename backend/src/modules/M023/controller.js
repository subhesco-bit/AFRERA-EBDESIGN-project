/**
 * Controller for Farmer Training (M023)
 * Handles HTTP requests for farmer training operations
 */

const farmerTrainingService = require('./service');

const createTrainingProgram = async (req, res) => {
  try {
    const program = await farmerTrainingService.createTrainingProgram(req.body);
    res.status(201).json({ success: true, data: program });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createTrainingSession = async (req, res) => {
  try {
    const session = await farmerTrainingService.createTrainingSession(req.body);
    res.status(201).json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const enrollFarmer = async (req, res) => {
  try {
    const enrollment = await farmerTrainingService.enrollFarmer(req.params.sessionId, req.body.farmer_id);
    res.status(201).json({ success: true, data: enrollment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const recordAttendance = async (req, res) => {
  try {
    const attendance = await farmerTrainingService.recordAttendance(req.params.sessionId, req.params.farmerId, req.body);
    res.status(201).json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const submitAssessment = async (req, res) => {
  try {
    const result = await farmerTrainingService.submitAssessment(req.params.assessmentId, req.body.farmer_id, req.body.answers);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getRecommendedPrograms = async (req, res) => {
  try {
    const recommendations = await farmerTrainingService.getRecommendedPrograms(req.params.farmerId);
    res.status(200).json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getTrainingAnalytics = async (req, res) => {
  try {
    const analytics = await farmerTrainingService.getTrainingAnalytics(req.query);
    res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createTrainingProgram,
  createTrainingSession,
  enrollFarmer,
  recordAttendance,
  submitAssessment,
  getRecommendedPrograms,
  getTrainingAnalytics
};
