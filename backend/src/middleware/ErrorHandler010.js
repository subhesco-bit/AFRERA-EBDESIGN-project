export function ErrorHandler010(err, req, res, next) {
  res.status(500).json({ error: err.message });
}
