export default async function handler(req, res) {
  console.log('[PROCESS API] Request received:', req.method, req.url);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body || {};
  console.log('[PROCESS API] URL:', url);

  // Return success immediately for testing
  return res.status(200).json({
    id: 'test-guide-123',
    status: 'queued',
    message: 'Test: API endpoint is working!',
  });
}
