/**
 * Controller for Returns Management (M058)
 */
const returnService = require('./service');

const create = async (req, res) => {
  try {
    const returnRequest = await returnService.createReturn(req.body);
    res.status(201).json({ success: true, data: returnRequest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const get = async (req, res) => {
  try {
    let returnRequest = await returnService.getReturn(req.params.id);
    if (!returnRequest) return res.status(404).json({ success: false, error: 'Return not found' });
    res.status(200).json({ success: true, data: returnRequest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    let returnRequest = await returnService.updateReturnStatus(req.params.id, req.body.status, req.body.notes);
    if (!returnRequest) return res.status(404).json({ success: false, error: 'Return not found' });
    res.status(200).json({ success: true, data: returnRequest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { create, get, updateStatus };
