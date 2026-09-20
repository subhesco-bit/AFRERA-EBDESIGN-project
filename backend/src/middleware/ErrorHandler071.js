export function ErrorHandler071(err, req, res, next) {
  res.status(500).json({ error: err.message });
}
