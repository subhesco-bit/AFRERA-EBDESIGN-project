export function ErrorHandler070(err, req, res, next) {
  res.status(500).json({ error: err.message });
}
