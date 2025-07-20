import type { NextApiRequest, NextApiResponse } from 'next';

export default async function api_rain_forecast_series_36(req: NextApiRequest, res: NextApiResponse) {
  try {
    const response = await fetch('https://cbmweather.my.id/api/lag/30/plt_rain_series36.json');
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Gagal fetch prediksi:', error);
    res.status(500).json({ error: 'Gagal ambil data dari server Flask' });
  }
}
