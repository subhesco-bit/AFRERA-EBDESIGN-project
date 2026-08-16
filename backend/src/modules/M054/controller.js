/**
 * Controller for Customer Management (M054)
 * Handles HTTP requests for customer operations
 */

const customerService = require('./service');

const create = async (req, res) => {
  try {
    const customer = await customerService.createCustomer(req.body);
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const list = async (req, res) => {
  try {
    const customers = await customerService.listCustomers(req.query);
    res.status(200).json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const get = async (req, res) => {
  try {
    const customer = await customerService.getCustomer(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const customer = await customerService.updateCustomer(req.params.id, req.body);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const deleted = await customerService.deleteCustomer(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    res.status(200).json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getCustomerInsights = async (req, res) => {
  try {
    const insights = await customerService.getCustomerInsights(req.params.id);
    res.status(200).json({ success: true, data: insights });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  create,
  list,
  get,
  update,
  remove,
  getCustomerInsights
};
