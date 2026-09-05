/**
 * Controller for Review Management (M060)
 */
const reviewService = require('./service');

const create = async (req, res) => {
  try {
    const review = await reviewService.createReview(req.body);
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const list = async (req, res) => {
  try {
    const reviews = await reviewService.getProductReviews(req.params.productId, req.query);
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const get = async (req, res) => {
  try {
    let review = await reviewService.getReview(req.params.id);
    if (!review) return res.status(404).json({ success: false, error: 'Review not found' });
    res.status(200).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const update = async (req, res) => {
  try {
    let review = await reviewService.updateReviewStatus(req.params.id, req.body.status);
    if (!review) return res.status(404).json({ success: false, error: 'Review not found' });
    res.status(200).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { create, list, get, update };
