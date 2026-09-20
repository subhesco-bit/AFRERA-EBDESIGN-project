export function ErrorHandler061(err, req, res, next) {
  res.status(500).json({ error: err.message });
}
