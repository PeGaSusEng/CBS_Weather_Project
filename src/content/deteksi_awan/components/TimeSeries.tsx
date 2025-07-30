"use client";
import React, { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const jenisList = [
  "Awan Tipis",
  "Langit Cerah",
  "Cumulonimbus",
  "Awan Campuran"
];

interface DataAwan {
  time: string;
  kode: string;
  jenis: string;
  deskripsi: string;
  timestamp: string;
  xLabel: string;
}

const API_URLS = [
  "/api/plot_cloud_series_36entry_lag_30",
  "/api/plot_cloud_series_36entry_lag_60"
];

export default function TimeSeriesAwanCustomLabel() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DataAwan[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => setIsMobile(window.innerWidth < 520);
      handleResize(); 
      window.addEventListener("resize", handleResize);

      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);


  useEffect(() => {
    let running = true;
    async function fetchData() {
      try {
        const responses = await Promise.all(API_URLS.map(url => fetch(url)));
        const allData = await Promise.all(responses.map(res => res.json()));
        const merged = allData.flat();
        const filtered = merged
          .filter((d: any) => jenisList.includes(d.jenis))
          .map((d: any) => {
            const tanggal = d.timestamp.slice(0, 10);
            const jam = d.time;
            return {
              ...d,
              xLabel: `${tanggal} ${jam}`,
            };
          })
          .sort((a: DataAwan, b: DataAwan) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        if (running) setData(filtered);
        if (running) setLoading(false);
      } catch (error) {
        if (running) setLoading(false);
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => {
      running = false;
      clearInterval(interval);
    };
  }, []);

  if (loading) return <div className="p-2 text-xs">Loading...</div>;
  if (!data.length) return <div className="p-2 text-xs text-red-500">Data tidak ditemukan.</div>;

  const xInterval = isMobile
    ? Math.max(1, Math.floor(data.length / 3))  
    : Math.ceil(data.length / 10); 

  return (
    <div className="w-full h-full flex flex-col justify-between bg-transparent p-0">
      <h2 className="text-xs md:text-sm font-semibold mb-0 text-center text-black dark:text-white">
        Hasil Prediksi jenis awan selama 24 jam dari Artificial Intelligence
      </h2>
      <div className="flex-1 min-h-0 w-full">
        <ResponsiveContainer width="100%" height={isMobile ? 180 : 280}>
          <LineChart
            data={data}
            margin={{
              top: isMobile ? 16 : 20,    
              right: isMobile ? 3 : 15,
              bottom: isMobile ? 26 : 40,
              left: isMobile ? 12 : 40
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="xLabel"
              interval={xInterval}
              angle={isMobile ? -14 : -15}
              textAnchor="end"
              height={isMobile ? 28 : 50}
              tick={{ fontSize: isMobile ? 7 : 10, stroke: "#d1d5db" }}
            />
            <YAxis
              dataKey="jenis"
              type="category"
              domain={jenisList}
              tick={{ fontSize: isMobile ? 9 : 12, stroke: "#d1d5db" }}
            />
            <Tooltip
              formatter={(value) => value}
              labelFormatter={(label) => `Waktu: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="jenis"
              stroke="#2563eb"
              strokeWidth={2.4}
              dot={{ r: isMobile ? 2 : 3 }}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
