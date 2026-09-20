export function ErrorHandler046(err, req, res, next) {
  res.status(500).json({ error: err.message });
}
