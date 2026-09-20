export function ErrorHandler076(err, req, res, next) {
  res.status(500).json({ error: err.message });
}
