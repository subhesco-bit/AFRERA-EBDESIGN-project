export function ErrorHandler034(err, req, res, next) {
  res.status(500).json({ error: err.message });
}
