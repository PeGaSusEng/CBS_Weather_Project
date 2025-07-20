// pages/api/list_data_satelite.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const backendRes = await fetch('https://cbmweather.my.id/api/list_himawari9');
    const data = await backendRes.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}