export function ErrorHandler018(err, req, res, next) {
  res.status(500).json({ error: err.message });
}
