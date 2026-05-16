export default function handler(req, res) {
  res.status(200).json({
    data: [{
      id: 'rec-1',
      type: 'model-switch',
      title: 'Switch to Haiku',
      confidence: 87
    }]
  });
}
