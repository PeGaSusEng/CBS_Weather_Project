// pages/api/plot_cloud_series_36entry_lag_60.ts
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const upstream = await fetch(
      'https://cbmweather.my.id/api/lag/60/plt_cloud_series_36entry.json'
    )
    if (!upstream.ok) {
      return res.status(upstream.status).end()
    }
    const data = await upstream.json()

    // ⚡️ Cache 60s di Vercel Edge, boleh serve stale 5m
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=300'
    )
    return res.status(200).json(data)
  } catch (error) {
    console.error('Gagal fetch prediksi:', error)
    return res
      .status(500)
      .json({ error: 'Gagal ambil data dari server Flask' })
  }
}
