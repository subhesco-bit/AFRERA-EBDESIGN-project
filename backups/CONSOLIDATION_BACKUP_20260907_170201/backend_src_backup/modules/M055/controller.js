/**
 * Controller for Pricing Management (M055)
 * Handles HTTP requests for pricing operations
 */

const pricingService = require('./service');

const create = async (req, res) => {
  try {
    const rule = await pricingService.createPricingRule(req.body);
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const list = async (req, res) => {
  try {
    const rules = await pricingService.listPricingRules(req.query);
    res.status(200).json({ success: true, data: rules });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const get = async (req, res) => {
  try {
    const price = await pricingService.calculateDynamicPrice(req.params.id, req.body);
    res.status(200).json({ success: true, data: price });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const rule = await pricingService.updatePricingRule(req.params.id, req.body);
    if (!rule) {
      return res.status(404).json({ success: false, error: 'Pricing rule not found' });
    }
    res.status(200).json({ success: true, data: rule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const deleted = await pricingService.deletePricingRule(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Pricing rule not found' });
    }
    res.status(200).json({ success: true, message: 'Pricing rule deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  create,
  list,
  get,
  update,
  remove
};
