const connectivityService = require('./connectivityService');

function sendError(res, error) {
  return res.status(400).json({ success: false, error: error.message });
}

async function createNode(req, res) {
  try { return res.status(201).json({ success: true, data: await connectivityService.createNode(req.body) }); }
  catch (error) { return sendError(res, error); }
}

async function linkVillage(req, res) {
  try { return res.status(201).json({ success: true, data: await connectivityService.linkVillage(req.params.villageId, req.body) }); }
  catch (error) { return sendError(res, error); }
}

async function addRoad(req, res) {
  try { return res.status(201).json({ success: true, data: await connectivityService.addRoad(req.params.villageId, req.body) }); }
  catch (error) { return sendError(res, error); }
}

async function getMap(req, res) {
  try { return res.json({ success: true, data: await connectivityService.getMap(req.params.villageId) }); }
  catch (error) { return sendError(res, error); }
}

async function upsertAssessment(req, res) {
  try { return res.status(201).json({ success: true, data: await connectivityService.upsertAssessment(req.params.villageId, req.body) }); }
  catch (error) { return sendError(res, error); }
}

async function getAssessment(req, res) {
  try { return res.json({ success: true, data: await connectivityService.getAssessment(req.params.villageId) }); }
  catch (error) { return sendError(res, error); }
}

module.exports = { createNode, linkVillage, addRoad, getMap, upsertAssessment, getAssessment };
