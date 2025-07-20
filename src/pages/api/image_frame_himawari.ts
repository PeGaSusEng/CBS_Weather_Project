// src/pages/api/himawari9-proxy.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { filename } = req.query;
  if (!filename || typeof filename !== 'string') {
    return res.status(400).json({ error: 'Missing filename' });
  }

  const url = `https://cbmweather.my.id/api/himawari9/${filename}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(404).json({ error: 'Image not found' });
    }
    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'image/png');
    // ganti baris ini:
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.status(200).send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({ error: 'Failed to proxy image' });
  }
}
