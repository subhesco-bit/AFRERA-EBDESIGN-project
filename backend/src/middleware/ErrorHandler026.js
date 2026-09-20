export function ErrorHandler026(err, req, res, next) {
  res.status(500).json({ error: err.message });
}
