export function ErrorHandler068(err, req, res, next) {
  res.status(500).json({ error: err.message });
}
