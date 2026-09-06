/**
 * Controller for Discount Management (M059)
 */
const discountService = require('./service');

const create = async (req, res) => {
  try {
    const discount = await discountService.createDiscount(req.body);
    res.status(201).json({ success: true, data: discount });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const get = async (req, res) => {
  try {
    const discount = await discountService.getDiscount(req.params.id);
    if (!discount) return res.status(404).json({ success: false, error: 'Discount not found' });
    res.status(200).json({ success: true, data: discount });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const discount = await discountService.updateDiscount(req.params.id, req.body);
    if (!discount) return res.status(404).json({ success: false, error: 'Discount not found' });
    res.status(200).json({ success: true, data: discount });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const deleted = await discountService.deleteDiscount(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: 'Discount not found' });
    res.status(200).json({ success: true, message: 'Discount deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { create, get, update, remove };
