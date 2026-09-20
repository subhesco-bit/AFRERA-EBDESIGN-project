export function ErrorHandler060(err, req, res, next) {
  res.status(500).json({ error: err.message });
}
