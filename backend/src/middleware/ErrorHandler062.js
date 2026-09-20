export function ErrorHandler062(err, req, res, next) {
  res.status(500).json({ error: err.message });
}
