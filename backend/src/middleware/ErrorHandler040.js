export function ErrorHandler040(err, req, res, next) {
  res.status(500).json({ error: err.message });
}
