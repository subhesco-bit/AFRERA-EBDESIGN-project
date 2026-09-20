export function ErrorHandler111(err, req, res, next) {
  res.status(500).json({ error: err.message });
}
