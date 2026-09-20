export function ErrorHandler038(err, req, res, next) {
  res.status(500).json({ error: err.message });
}
