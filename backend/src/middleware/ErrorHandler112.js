export function ErrorHandler112(err, req, res, next) {
  res.status(500).json({ error: err.message });
}
