export default async function handler(req, res) {
  console.log('[PROCESS TEST] Request received:', req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body || {};
  console.log('[PROCESS TEST] URL:', url);

  return res.status(200).json({
    id: 'test-123',
    status: 'queued',
    message: 'Test successful',
  });
}
