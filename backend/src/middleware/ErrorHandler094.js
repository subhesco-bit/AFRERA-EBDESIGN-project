export function ErrorHandler094(err, req, res, next) {
  res.status(500).json({ error: err.message });
}
