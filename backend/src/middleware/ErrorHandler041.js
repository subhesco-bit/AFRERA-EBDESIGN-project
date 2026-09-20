export function ErrorHandler041(err, req, res, next) {
  res.status(500).json({ error: err.message });
}
