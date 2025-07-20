import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path } = req.query;

  if (!path || typeof path !== 'string') {
    return res.status(400).json({ error: 'Invalid path parameter' });
  }

  const backendUrl = `https://cbmweather.my.id${decodeURIComponent(path)}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // Timeout 8 detik

    const imageRes = await fetch(backendUrl, {
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!imageRes.ok) {
      throw new Error(`Backend returned ${imageRes.status}`);
    }

    // Forward headers
    res.setHeader('Content-Type', imageRes.headers.get('Content-Type') || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const imageBuffer = await imageRes.arrayBuffer();
    res.send(Buffer.from(imageBuffer));
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ 
      error: 'Failed to proxy image',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}