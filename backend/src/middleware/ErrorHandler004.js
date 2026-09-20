export function ErrorHandler004(err, req, res, next) {
  res.status(500).json({ error: err.message });
}
