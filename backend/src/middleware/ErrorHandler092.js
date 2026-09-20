export function ErrorHandler092(err, req, res, next) {
  res.status(500).json({ error: err.message });
}
