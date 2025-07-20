import type { NextApiRequest, NextApiResponse } from 'next';

export default async function api_tabel_yes_no_36(req: NextApiRequest, res: NextApiResponse) {
  try {
    const response = await fetch('https://cbmweather.my.id/api/static/latest_image.json');
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Gagal fetch prediksi:', error);
    res.status(500).json({ error: 'Gagal ambil data dari server Flask' });
  }
}
