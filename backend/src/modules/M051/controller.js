/**
 * Controller for FPO Registration (M051)
 * Handles HTTP requests for FPO operations
 */

const fpoService = require('./service');

const createFPO = async (req, res) => {
  try {
    const fpo = await fpoService.createFPO(req.body);
    res.status(201).json({ success: true, data: fpo });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const listFPOs = async (req, res) => {
  try {
    const fpos = await fpoService.listFPOs(req.query);
    res.status(200).json({ success: true, data: fpos });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getFPO = async (req, res) => {
  try {
    let fpo = await fpoService.getFPO(req.params.id);
    if (!fpo) {
      return res.status(404).json({ success: false, error: 'FPO not found' });
    }
    res.status(200).json({ success: true, data: fpo });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateFPO = async (req, res) => {
  try {
    let fpo = await fpoService.updateFPO(req.params.id, req.body);
    if (!fpo) {
      return res.status(404).json({ success: false, error: 'FPO not found' });
    }
    res.status(200).json({ success: true, data: fpo });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteFPO = async (req, res) => {
  try {
    const deleted = await fpoService.deleteFPO(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'FPO not found' });
    }
    res.status(200).json({ success: true, message: 'FPO deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const addFPOMember = async (req, res) => {
  try {
    const member = await fpoService.addFPOMember(req.params.id, req.body.farmerId, req.body);
    res.status(201).json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getFPOMembers = async (req, res) => {
  try {
    const members = await fpoService.getFPOMembers(req.params.id);
    res.status(200).json({ success: true, data: members });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getFPOFinancialSummary = async (req, res) => {
  try {
    const summary = await fpoService.getFPOFinancialSummary(req.params.id);
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const recordFPOTransaction = async (req, res) => {
  try {
    const transaction = await fpoService.recordFPOTransaction(req.params.id, req.body);
    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const generateFPOPerformanceReport = async (req, res) => {
  try {
    const report = await fpoService.generateFPOPerformanceReport(req.params.id);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createFPO,
  listFPOs,
  getFPO,
  updateFPO,
  deleteFPO,
  addFPOMember,
  getFPOMembers,
  getFPOFinancialSummary,
  recordFPOTransaction,
  generateFPOPerformanceReport
};
