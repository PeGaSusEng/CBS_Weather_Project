// pages/api/himawari9-edge.ts
import { NextRequest, NextResponse } from 'next/server'

export const config = {
  runtime: 'edge',
  regions: ['all'],
}

export default async function handler(req: NextRequest) {
  const url = new URL(req.url)
  const filename = url.searchParams.get('filename')
  if (!filename) {
    return NextResponse.json({ error: 'Missing filename' }, { status: 400 })
  }

  const externalUrl = `https://cbmweather.my.id/api/himawari9/${filename}`

  return NextResponse.redirect(externalUrl, {
    status: 307,
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
    }
  })
}
