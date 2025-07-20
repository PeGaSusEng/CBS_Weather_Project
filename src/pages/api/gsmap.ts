import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const backendUrl = 'https://cbmweather.my.id/api/list_gsmap_overlay_legend_detail';
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); 

    const backendRes = await fetch(backendUrl, {
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!backendRes.ok) {
      throw new Error(`Backend error: ${backendRes.status}`);
    }

    const data = await backendRes.json();

    // Validasi data
    if (!data.gsmapcek_overlay || !data.gsmapcek_legend) {
      throw new Error('Invalid data structure from backend');
    }

    // Proses URL
    const processUrl = (url: string) => {
      if (!url) return '';
      return `/api/gsmap-proxy?path=${encodeURIComponent(url)}`;
    };

    const processedData = {
      gsmapcek_overlay: data.gsmapcek_overlay.map((item: any) => ({
        ...item,
        url: processUrl(item.url)
      })),
      gsmapcek_legend: data.gsmapcek_legend.map((item: any) => ({
        ...item,
        url: processUrl(item.url)
      }))
    };

    res.status(200).json(processedData);
  } catch (error) {
    console.error('GSMap API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch GSMap data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}