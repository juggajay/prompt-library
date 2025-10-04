import express from 'express';
import { createServer as createViteServer } from 'vite';

const app = express();
app.use(express.json());

// Import API handlers dynamically
const loadHandler = async (path) => {
  const module = await import(`./api/${path}`);
  return module.default;
};

// API routes
app.get('/api/test', async (req, res) => {
  const handler = await loadHandler('test.js');
  return handler(req, res);
});

app.get('/api/doc-reader/guides', async (req, res) => {
  const handler = await loadHandler('doc-reader/guides.js');
  return handler(req, res);
});

app.post('/api/doc-reader/process', async (req, res) => {
  const handler = await loadHandler('doc-reader/process.js');
  return handler(req, res);
});

app.get('/api/doc-reader/guides/:id', async (req, res) => {
  const handler = await loadHandler('doc-reader/guides/[id].js');
  return handler(req, res);
});

app.delete('/api/doc-reader/guides/:id', async (req, res) => {
  const handler = await loadHandler('doc-reader/guides/[id].js');
  return handler(req, res);
});

// Create Vite server in middleware mode
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: 'spa'
});

// Use vite's connect instance as middleware
app.use(vite.middlewares);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Dev server running on http://localhost:${PORT}`);
});
