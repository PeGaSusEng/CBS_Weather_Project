"use client";
import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const jenisList = [
  "Awan Tipis",
  "Langit Cerah",
  "Cumulonimbus",
  "Awan Campuran"
];
const COLORS = ["#60a5fa", "#a3e635", "#f87171", "#fbbf24"];

interface DataAwan {
  time: string;
  kode: string;
  jenis: string;
  deskripsi: string;
  timestamp: string;
}

const API_URLS = [
  "/api/plot_cloud_series_36entry_lag_30",
  "/api/plot_cloud_series_36entry_lag_60"
];

export default function PieAwan24Jam() {
  const [data, setData] = useState<DataAwan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => setIsMobile(window.innerWidth < 500);
      handleResize(); // Set initial value
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
        const filtered = merged.filter((d: DataAwan) => jenisList.includes(d.jenis.trim()));
        if (running) setData(filtered);
        if (running) setLoading(false);
      } catch (e) {
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

  const pieData = jenisList.map(jenis => ({
    name: jenis,
    value: data.filter(d => d.jenis.trim() === jenis).length,
  }));

  let labelPie = "Distribusi Awan";
  if (data.length > 0) {
    const sorted = [...data].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const tglAwal = sorted[0].timestamp.replace("T", " ").slice(0, 16);
    const tglAkhir = sorted[sorted.length - 1].timestamp.replace("T", " ").slice(0, 16);
    labelPie = `Distribusi Awan\n${tglAwal} — ${tglAkhir}`;
  }

  if (loading) return <div className="p-4">Loading...</div>;
  if (!data.length) return <div className="p-4 text-red-500">Data tidak ditemukan.</div>;

  return (
    <div className="w-full h-full flex flex-col justify-center items-center bg-transparent p-0">
      <h2 className="mt-8 text-[12px] sm:text-[11px] font-semibold mb-2 sm:mb-0 text-center whitespace-pre-line text-black dark:text-white">
        {labelPie}
      </h2>

      <div className="w-full min-h-[220px] flex items-center justify-center mt-4 sm:mt-0 sm:w-3/4">
        <ResponsiveContainer width="80%" aspect={1.5}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={isMobile ? "70%" : "90%"}
              labelLine={false}
              isAnimationActive={false}
            >
              {pieData.map((entry, idx) => (
                <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
