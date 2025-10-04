export default async function handler(req, res) {
  console.log('[PROCESS-URL API] Request received:', req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body || {};
  console.log('[PROCESS-URL API] URL:', url);

  // Return success immediately for testing
  return res.status(200).json({
    id: 'test-guide-456',
    status: 'queued',
    message: 'Flat API endpoint working!',
    url: url,
  });
}
