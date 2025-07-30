// pages/api/plot_cloud_series_36entry_lag_30.ts
import { NextRequest, NextResponse } from 'next/server'

export const config = {
  runtime: 'edge',
  regions: ['all'],                // cache di semua edge region
}

export default async function handler(req: NextRequest) {
  try {
    const upstream = await fetch(
      'https://cbmweather.my.id/api/lag/30/plt_cloud_series_36entry.json',
      {
        next: { revalidate: 60 },   // edge cache selama 60 detik
        cache: 'force-cache',
      }
    )
    if (!upstream.ok) return NextResponse.error()

    const data = await upstream.json()

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      },
    })
  } catch (e) {
    console.error('Gagal fetch prediksi:', e)
    return NextResponse.json(
      { error: 'Gagal ambil data dari server Flask' },
      { status: 500 }
    )
  }
}
