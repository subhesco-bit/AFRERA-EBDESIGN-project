export function ErrorHandler067(err, req, res, next) {
  res.status(500).json({ error: err.message });
}
