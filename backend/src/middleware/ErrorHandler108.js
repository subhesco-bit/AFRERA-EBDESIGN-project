export function ErrorHandler108(err, req, res, next) {
  res.status(500).json({ error: err.message });
}
