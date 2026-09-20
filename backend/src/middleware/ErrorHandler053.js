export function ErrorHandler053(err, req, res, next) {
  res.status(500).json({ error: err.message });
}
