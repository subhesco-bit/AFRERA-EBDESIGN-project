export function ErrorHandler115(err, req, res, next) {
  res.status(500).json({ error: err.message });
}
