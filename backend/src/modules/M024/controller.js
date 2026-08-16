/**
 * Controller for Farmer Groups (M024)
 */

const farmerGroupsService = require('./service');

const createFarmerGroup = async (req, res) => {
  try {
    const group = await farmerGroupsService.createFarmerGroup(req.body);
    res.status(201).json({ success: true, data: group });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const addGroupMember = async (req, res) => {
  try {
    const membership = await farmerGroupsService.addGroupMember(req.params.groupId, req.body.farmer_id, req.body);
    res.status(201).json({ success: true, data: membership });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const recordGroupMeeting = async (req, res) => {
  try {
    const meeting = await farmerGroupsService.recordGroupMeeting(req.params.groupId, req.body);
    res.status(201).json({ success: true, data: meeting });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const recordGroupTransaction = async (req, res) => {
  try {
    const transaction = await farmerGroupsService.recordGroupTransaction(req.params.groupId, req.body);
    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getGroupAnalytics = async (req, res) => {
  try {
    const analytics = await farmerGroupsService.getGroupAnalytics(req.params.groupId);
    res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createFarmerGroup,
  addGroupMember,
  recordGroupMeeting,
  recordGroupTransaction,
  getGroupAnalytics
};
