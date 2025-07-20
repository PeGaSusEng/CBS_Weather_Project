// src/utils/fetchHimawari.ts
export interface HimawariFrame {
  filename: string;
  url: string;       
  datetime: string;  
}

export async function fetchHimawariList(): Promise<HimawariFrame[]> {
  const res = await fetch('/api/list_data_satelite'); // Panggil API route Next.js
  if (!res.ok) throw new Error('Failed to fetch Himawari frames');
  return await res.json();
}