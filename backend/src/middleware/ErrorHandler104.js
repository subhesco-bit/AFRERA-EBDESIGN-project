export function ErrorHandler104(err, req, res, next) {
  res.status(500).json({ error: err.message });
}
