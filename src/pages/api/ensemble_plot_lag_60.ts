import type { NextApiRequest, NextApiResponse } from 'next';

export default async function api_ensemble_plot(req: NextApiRequest, res: NextApiResponse) {
  try {
    const response = await fetch('https://cbmweather.my.id/api/lag/60/ensemble_plot_data.json');
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Gagal fetch prediksi:', error);
    res.status(500).json({ error: 'Gagal ambil data dari server Flask' });
  }
}
