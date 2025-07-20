import { useEffect, useState } from "react";

type AwsItem = {
  waktu_wib: string;
  ch_mm: number;
};

type AwsData = {
  filename: string;
  data: AwsItem[];
};

type GsmapItem = {
  waktu_wib: string;
  curah_hujan_mm: number;
};

type TabelBaris = {
  tanggal: string;
  jam: string;
  chAws: string;
  chGsmap: string;
  prediksiCNN30: string;
  prediksiCNN60: string;
  labelObs: string;
  labelGsmap: string;
  labelCNN: string;
};

export default function TabelPrediksiHujan() {
  const [data, setData] = useState<TabelBaris[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    async function fetchData() {
      try {
        const [
          awsRes,
          gsmapRes,
          cnn30Res,
          cnn60Res
        ] = await Promise.all([
          fetch("/api/data_obs", { headers: { 'Cache-Control': 'no-cache' } }).then(r => r.json()),
          fetch("/api/data_series_gsmap", { headers: { 'Cache-Control': 'no-cache' } }).then(r => r.json()),
          fetch("/api/rain_forecast_series_36_lag_30", { headers: { 'Cache-Control': 'no-cache' } }).then(r => r.json()),
          fetch("/api/rain_forecast_series_36_lag_60", { headers: { 'Cache-Control': 'no-cache' } }).then(r => r.json())
        ]);

        const arrAwsRes = Array.isArray(awsRes) ? awsRes : [];
        const arrGsmapRes = Array.isArray(gsmapRes) ? gsmapRes : [];
        const arrCnn30 = Array.isArray(cnn30Res) ? cnn30Res : [];
        const arrCnn60 = Array.isArray(cnn60Res) ? cnn60Res : [];

        const cnnTimestamps = Array.from(new Set(
          [...arrCnn30, ...arrCnn60].map(d => d.timestamp)
        )).sort();

        const rows: TabelBaris[] = cnnTimestamps.map((timestamp) => {
          const tanggal = timestamp.slice(0, 10).split('-').reverse().join('/');
          const jam = timestamp.slice(11, 16);

          // Ambil data prediksi untuk CNN lag 30 dan lag 60
          const cnnData30 = arrCnn30.find(d => d.timestamp === timestamp);
          const cnnData60 = arrCnn60.find(d => d.timestamp === timestamp);
          
          const prediksiCNN30 = cnnData30 ? cnnData30.chance : undefined;
          const prediksiCNN60 = cnnData60 ? cnnData60.chance : undefined;

          // Klasifikasi berdasarkan prediksi CNN untuk Lag 30 dan Lag 60
          const labelCNN30 = prediksiCNN30 !== undefined
            ? (Number(prediksiCNN30) > 0.5 ? "Hujan" : "Tidak Hujan")
            : "-";
          const labelCNN60 = prediksiCNN60 !== undefined
            ? (Number(prediksiCNN60) > 0.5 ? "Hujan" : "Tidak Hujan")
            : "-";

          // CH AWS & Label OBS sinkronisasi
          let chAws: number | string = "-";
          if (arrAwsRes && arrAwsRes.length) {
            let total = 0, count = 0;
            arrAwsRes.forEach((stasiun) => {
              const obs = stasiun.data.reduce((a: GsmapItem, b: GsmapItem) => {
                const timeA = Math.abs(new Date(a.waktu_wib).getTime() - new Date(timestamp).getTime());
                const timeB = Math.abs(new Date(b.waktu_wib).getTime() - new Date(timestamp).getTime());
                return timeA < timeB ? a : b;
              }, {}); 
              if (Object.keys(obs).length > 0 && Math.abs(new Date(obs.waktu_wib).getTime() - new Date(timestamp).getTime()) < 11 * 60 * 1000) {
                total += Number(obs.ch_mm);
                count += 1;
              }
            });
            if (count) chAws = (total / count).toFixed(2);
          }

          // Klasifikasi berdasarkan BMKG untuk AWS
          const labelObs = chAws === "-" ? "-" : classifyHujan(Number(chAws));

          let chGsmap: number | string = "-";
          if (arrGsmapRes && arrGsmapRes.length) {
            const obs = arrGsmapRes.reduce((a, b) => {
              const timeA = Math.abs(new Date(a.waktu_wib).getTime() - new Date(timestamp).getTime());
              const timeB = Math.abs(new Date(b.waktu_wib).getTime() - new Date(timestamp).getTime());
              return timeA < timeB ? a : b;
            }, {});
            if (Object.keys(obs).length > 0 && Math.abs(new Date(obs.waktu_wib).getTime() - new Date(timestamp).getTime()) < 16 * 60 * 1000) {
              chGsmap = Number(obs.curah_hujan_mm).toFixed(2);
            }
          }

          // Klasifikasi berdasarkan BMKG untuk GSMaP
          const labelGsmap = chGsmap === "-" ? "-" : classifyHujan(Number(chGsmap));
          return {
            tanggal,
            jam,
            chAws: chAws.toString(),
            chGsmap: chGsmap.toString(),
            prediksiCNN30: prediksiCNN30 !== undefined ? (Number(prediksiCNN30) * 100).toFixed(2) : "-",
            prediksiCNN60: prediksiCNN60 !== undefined ? (Number(prediksiCNN60) * 100).toFixed(2) : "-",
            labelObs,
            labelGsmap,
            labelCNN: labelCNN30 === "Hujan" || labelCNN60 === "Hujan" ? "Hujan" : "Tidak Hujan"
          };
        });

        if (rows.length === 0) {
          setError("Data kosong atau tidak valid.");
        } else {
          setData(rows);
          setError(null);
        }

      } catch (err) {
        console.error("Error while fetching data:", err);  
        setError("Gagal mengambil data dari server.");
        setData([]);
      }
    }

    fetchData();
    intervalId = setInterval(fetchData, 3000);

    return () => clearInterval(intervalId);
  }, []);

  // Fungsi untuk klasifikasi curah hujan berdasarkan BMKG
  function classifyHujan(ch: number): string {
    if (ch >= 0.1 && ch <= 10) return "Hujan Ringan";
    if (ch > 10 && ch <= 50) return "Hujan Sedang";
    if (ch > 50 && ch <= 100) return "Hujan Lebat";
    if (ch > 100) return "Hujan Sangat Lebat";
    return "Tidak Hujan";
  }



  return (
    <div className="overflow-x-auto w-full">
      <div className="max-h-80 overflow-y-auto w-full rounded-xl shadow-md bg-white">
        {error ? (
          <div className="text-center text-red-600 py-4">{error}</div>
        ) : !data.length ? (
          <div className="text-center text-gray-600 py-4">Data masih kosong atau sedang diproses...</div>
        ) : (
          <table className="min-w-[820px] w-full border text-xs md:text-sm">
            <thead className="bg-blue-100 sticky top-0 z-10">
              <tr>
                <th className="p-2">Tanggal</th>
                <th className="p-2">Jam</th>
                <th className="p-2">CH AWS (mm)</th>
                <th className="p-2">CH GSMaP (mm)</th>
                <th className="p-2">Prediksi CNN Lag 30 (%)</th>
                <th className="p-2">Prediksi CNN Lag 60 (%)</th>
                <th className="p-2">Label OBS</th>
                <th className="p-2">Label GSMaP</th>
                <th className="p-2">Label CNN</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-blue-50" : ""}>
                  <td className="p-2 text-center">{row.tanggal}</td>
                  <td className="p-2 text-center">{row.jam}</td>
                  <td className="p-2 text-center">{row.chAws}</td>
                  <td className="p-2 text-center">{row.chGsmap}</td>
                  <td className="p-2 text-center">{row.prediksiCNN30}</td>
                  <td className="p-2 text-center">{row.prediksiCNN60}</td>
                  <td className={`p-2 text-center ${row.labelObs === "Hujan" ? "text-blue-600 font-bold" : row.labelObs === "-" ? "text-gray-400" : "text-gray-500"}`}>{row.labelObs}</td>
                  <td className={`p-2 text-center ${row.labelGsmap === "Hujan" ? "text-blue-600 font-bold" : row.labelGsmap === "-" ? "text-gray-400" : "text-gray-500"}`}>{row.labelGsmap}</td>
                  <td className={`p-2 text-center ${row.labelCNN === "Hujan" ? "text-blue-600 font-bold" : row.labelCNN === "-" ? "text-gray-400" : "text-gray-500"}`}>{row.labelCNN}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
