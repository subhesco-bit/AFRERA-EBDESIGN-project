/**
 * Controller for Shipping Management (M057)
 */
const shippingService = require('./service');

const create = async (req, res) => {
  try {
    const shipment = await shippingService.createShipment(req.body);
    res.status(201).json({ success: true, data: shipment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const track = async (req, res) => {
  try {
    let shipment = await shippingService.trackShipment(req.params.id);
    if (!shipment) return res.status(404).json({ success: false, error: 'Shipment not found' });
    res.status(200).json({ success: true, data: shipment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    let shipment = await shippingService.updateShipmentStatus(req.params.id, req.body.status, req.body.location);
    if (!shipment) return res.status(404).json({ success: false, error: 'Shipment not found' });
    res.status(200).json({ success: true, data: shipment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { create, track, updateStatus };
