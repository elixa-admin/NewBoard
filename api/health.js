export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    message: 'API running on Vercel'
  });
}
