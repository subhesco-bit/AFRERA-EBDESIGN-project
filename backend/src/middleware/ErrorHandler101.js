export function ErrorHandler101(err, req, res, next) {
  res.status(500).json({ error: err.message });
}
