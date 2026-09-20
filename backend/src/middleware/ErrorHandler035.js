export function ErrorHandler035(err, req, res, next) {
  res.status(500).json({ error: err.message });
}
