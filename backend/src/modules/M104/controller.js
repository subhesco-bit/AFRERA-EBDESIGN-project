/**
 * Controller for Equipment Rental (M104)
 * Handles HTTP requests for equipment rental operations
 */

const rentalService = require('./service');

const listEquipmentForRental = async (req, res) => {
  try {
    const rental = await rentalService.listEquipmentForRental(req.body);
    res.status(201).json({ success: true, data: rental });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const bookEquipmentRental = async (req, res) => {
  try {
    const booking = await rentalService.bookEquipmentRental(req.body);
    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const trackRentalPerformance = async (req, res) => {
  try {
    const performance = await rentalService.trackRentalPerformance(req.params.id, req.query.period);
    res.status(200).json({ success: true, data: performance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const generateRentalReport = async (req, res) => {
  try {
    const report = await rentalService.generateRentalReport(req.params.ownerId, req.query.reportType);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  listEquipmentForRental,
  bookEquipmentRental,
  trackRentalPerformance,
  generateRentalReport
};
