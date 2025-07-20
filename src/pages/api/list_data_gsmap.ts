import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const gsmapList = await fetchGsmapList();
    res.status(200).json(gsmapList);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}

async function fetchGsmapList() {
  const res = await fetch('https://cbmweather.my.id/api/list_gsmap_overlay_legend_detail');
  if (!res.ok) throw new Error('Failed to fetch Himawari frames');
  return await res.json();
}
