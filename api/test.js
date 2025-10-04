export default function handler(req, res) {
  console.log('[TEST API] Hit!');
  return res.status(200).json({ message: 'API is working!' });
}
