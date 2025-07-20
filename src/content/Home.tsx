'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const FontLoader = () => (
  <Head>
    <link
      href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600&display=swap"
      rel="stylesheet"
    />
    <style>{`body { font-family: 'Quicksand', sans-serif; }`}</style>
  </Head>
);

type Prediksi = {
  waktu: string;
  cuaca: string;
  curah_hujan: string;
  VT?: string;
  ST?: string;
  IS?: string;
};

const parseWIB = (waktuString?: string | null) => {
  if (!waktuString || typeof waktuString !== "string" || !waktuString.includes(":")) return null;
  const [jam, menit] = waktuString.replace(' WIB', '').trim().split(':').map(Number);
  if (isNaN(jam) || isNaN(menit)) return null;
  const d = new Date();
  d.setHours(jam, menit, 0, 0);
  return d;
};



export default function Home() {
  const [data, setData] = useState<Prediksi[]>([]);
  const [tanggalPrediksi, setTanggalPrediksi] = useState<string>('');
  const router = useRouter();

  // Carousel control
  const [startIndex, setStartIndex] = useState(0);
  const [cardsPerPage, setCardsPerPage] = useState(4);

  // Update cards per page responsively
    useEffect(() => {
      if (typeof window !== 'undefined') {
        function handleResize() {
          if (window.innerWidth < 640) setCardsPerPage(1);
          else if (window.innerWidth < 900) setCardsPerPage(2);
          else setCardsPerPage(4);
        }
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
      }
    }, []);


  // Fetch and merge data from lag_30 and lag_60
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch lag 30 dan lag 60 secara paralel
        const [res30, res60] = await Promise.all([
          fetch('/api/info_prakiraan_cuaca_lag_30'),
          fetch('/api/info_prakiraan_cuaca_lag_60'),
        ]);
        const [json30, json60] = await Promise.all([res30.json(), res60.json()]);

        // Pastikan objeknya benar
        const arr30 = (json30 && typeof json30 === 'object')
          ? Object.values(json30).flat() as Prediksi[]
          : [];
        const arr60 = (json60 && typeof json60 === 'object')
          ? Object.values(json60).flat() as Prediksi[]
          : [];

        // Gabungkan, urutkan naik berdasar waktu
        const allPrediksi = [...arr30, ...arr60]
                 .sort((a, b) => {
         const da = parseWIB(a.waktu);
         const db = parseWIB(b.waktu);
           // jika salah satu gagal parse, anggap sama
           if (!da || !db) return 0;
           return da.getTime() - db.getTime();
         });

        setData(allPrediksi);
      } catch (err) {
        setData([]); // fallback ke array kosong
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Tanggal prediksi (ambil salah satu saja, bisa dari lag 30/lag 60)
  useEffect(() => {
    const ambilTanggal = async () => {
      try {
        const res = await fetch('/api/latest_lag_30');
        const data = await res.json();
        const tanggal = new Date(data.timestamp.split('T')[0]);
        const formatIndonesia = tanggal.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        });
        setTanggalPrediksi(formatIndonesia);
      } catch {
        setTanggalPrediksi('Gagal memuat tanggal');
      }
    };
    ambilTanggal();
  }, []);

  // SIAGA (biarkan tetap, dari lag 30)
  const [jamPrediksi, setJamPrediksi] = useState('Memuat...');
  const [jamPrediksiMinus30, setJamPrediksiMinus30] = useState('Memuat...');
  const [probabilitasHujan, setProbabilitasHujan] = useState<number | null>(null);
  const [namaAwan, setNamaAwan] = useState('Memuat...');
  const [statusSiaga, setStatusSiaga] = useState('Memuat...');
  const [statusCuaca, setStatusCuaca] = useState('Memuat...');

  useEffect(() => {
    const fetchSiaga = async () => {
      try {
        const res1 = await fetch('/api/ensemble_plot_lag_60');
        const data1 = await res1.json();
        if (data1.length > 0) {
          const waktuString = data1[0].waktu;
          setJamPrediksi(`${waktuString} WIB`);
          const [jam, menit] = waktuString.split(':').map(Number);
          const waktu = new Date();
          waktu.setHours(jam, menit);
          waktu.setMinutes(waktu.getMinutes() - 30);
          setJamPrediksiMinus30(`${waktu.getHours().toString().padStart(2, '0')}:${waktu.getMinutes().toString().padStart(2, '0')} WIB`);
        }
        const res2 = await fetch('/api/latest_lag_60');
        const data2 = await res2.json();
        const prob = data2.probabilitas_hujan;
        setProbabilitasHujan(prob);
        setNamaAwan(data2.kategori_awan_dominan?.nama || 'Tidak diketahui');
        setStatusCuaca(data2.label || 'Tidak diketahui');
        setStatusSiaga(prob >= 0.5 && data2.label === 'HUJAN' ? 'SIAGA' : 'NON SIAGA');
      } catch (err) {
        setJamPrediksi('Memuat...');
        setJamPrediksiMinus30('Memuat...');
        setProbabilitasHujan(null);
        setNamaAwan('Memuat...');
        setStatusCuaca('Memuat...');
        setStatusSiaga('Memuat...');
      }
    };
    fetchSiaga();
    const interval = setInterval(fetchSiaga, 5000);
    return () => clearInterval(interval);
  }, []);

  const isSiaga = statusSiaga === 'SIAGA';

  // Hanya data waktu ke depan saja (dibanding sekarang)
  const now = new Date();
  const filteredData = data.filter(item => {
    const t = parseWIB(item.waktu);
    return t && t >= now;
});


  // Ambil data yang sedang tampil (slice)
  const displayedData = filteredData.slice(startIndex, startIndex + cardsPerPage);

  // Tombol prev/next enable/disable
  const canPrev = startIndex > 0;
  const canNext = startIndex + cardsPerPage < filteredData.length;

  // Cek ada hujan
  const adaHujan = filteredData.some(item => item.cuaca?.toLowerCase() === 'hujan');
  const tidakHujan = filteredData.some(item => item.cuaca?.toLowerCase() === 'cerah');

  // Gambar cuaca
  const getImageByCuaca = (cuaca: string, waktu: string) => {
    const jam = parseInt(waktu.split(':')[0]);
    const isNight = jam >= 18 || jam < 6;
    const cuacaLower = cuaca.toLowerCase();
    if (cuacaLower === 'hujan') return isNight ? '/logos/hujan_malam.png' : '/logos/hujan_pagi.png';
    if (cuacaLower === 'cerah') return isNight ? '/logos/cerah_malam.png' : '/logos/cerah_pagi.png';
    return '/image/default.png';
  };

  return (
    <>
      <FontLoader />
      <Head>
        <title>CBM-Satellite-Weather-System</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div className="relative w-full min-h-screen overflow-y-auto bg-weather bg-cover bg-center px-4 py-2 pt-24 pb-32 flex flex-col items-center">
        <div className="w-full flex flex-col items-center justify-start">
          {/* Judul */}
          <div className="text-center mt-14 mb-8 px-4 py-2 bg-black/30 rounded-xl backdrop-blur-sm shadow-md">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white drop-shadow-md tracking-wide">
              Prakiraan Cuaca
            </h1>
            <p className="text-white text-base sm:text-lg mt-1 font-medium tracking-wide">
              {tanggalPrediksi}
            </p>
          </div>
          {/* Alert jika ada HUJAN */}
          <AnimatePresence>
            {adaHujan && (
              <motion.div
                className="w-full max-w-2xl mx-auto mb-3 px-4 py-3 bg-red-600/70 border-l-8 border-yellow-300 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 backdrop-blur"
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <span className="animate-bounce">⚠️</span>
                Peringatan: Ada potensi hujan pada waktu terdekat! Siapkan perlindungan!
              </motion.div>
            )}
          </AnimatePresence>
          {/* Alert jika tidak HUJAN */}
          <AnimatePresence>
            {tidakHujan && (
              <motion.div
                className="w-full max-w-2xl mx-auto mb-3 px-4 py-3 bg-blue-600/70 border-l-8 border-yellow-300 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 backdrop-blur"
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <span className="animate-bounce">🌤️</span>
                Peringatan: Prakiraan Menunjukkan Cuaca Cerah! Selamat beraktivitas 
              </motion.div>
            )}
          </AnimatePresence>
          {/* Carousel horizontal */}
          <div className="flex items-center justify-center w-full gap-3 mt-3 mb-12 relative">
            {/* Prev */}
            <button
              aria-label="Prev"
              onClick={() => canPrev && setStartIndex(startIndex - cardsPerPage)}
              disabled={!canPrev}
              className={`bg-white/80 hover:bg-white rounded-full w-14 h-14 flex items-center justify-center text-3xl font-bold shadow-lg transition
                ${!canPrev ? 'opacity-50 cursor-pointer' : 'cursor-pointer'}
                absolute left-0 top-1/2 -translate-y-1/2 z-10
                sm:static sm:translate-y-0
              `}
              style={{ zIndex: 2 }}
            >
              &lt;
            </button>
            {/* Boxes */}
            <div className="flex-1 flex justify-center items-stretch gap-7">
              {displayedData.length === 0 ? (
                <div className="bg-white/50 rounded-xl px-6 py-8 text-xl font-bold text-gray-700 shadow flex items-center justify-center w-full">
                  Tidak ada prakiraan waktu ke depan.
                </div>
              ) : (
                displayedData.map((item, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.06, y: -6, boxShadow: "0 8px 32px #1115" }}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 6, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.06 }}
                    className="relative bg-blue-transparent backdrop-blur-md rounded-2xl p-5 pb-7 min-h-[340px] flex flex-col items-center justify-between shadow-lg border border-white/30 w-[94vw] max-w-[320px]"
                  >
                    {/* Curah Hujan */}
                    <span className="absolute top-2 right-2 bg-white/90 text-blue-900 text-xs font-semibold px-2 py-1 rounded shadow-md">
                      {item.curah_hujan}
                    </span>
                    {/* Icon Cuaca (Animasi) */}
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <Image
                        src={getImageByCuaca(item.cuaca, item.waktu)}
                        alt={item.cuaca}
                        width={80}
                        height={80}
                        className="drop-shadow-md"
                      />
                    </motion.div>
                    {/* Jam & Status Cuaca */}
                    <div className="mb-4 mt-2">
                      <p className="text-base text-white drop-shadow">{item.waktu}</p>
                      <p className="font-bold uppercase text-2xl text-black drop-shadow">{item.cuaca}</p>
                    </div>
                    {/* Valid/Satellite/Issue Time */}
                    <div className="w-full text-left text-sm text-black/90 leading-relaxed font-medium mb-3 space-y-0.5">
                      <div>Valid Time: <b>{item.VT || item.waktu}</b></div>
                      <div>Satellite Time: <b>{item.ST || '-'}</b></div>
                      <div>Issue Time: <b>{item.IS || '-'}</b></div>
                    </div>
                    <button
                      onClick={() => router.push(`/Page_deteksi_awan`)}
                      className="text-xs text-blue-800 font-bold bg-white/40 hover:bg-white/70 px-3 py-1 rounded transition border border-white/30 shadow"
                    >
                      Detail
                    </button>
                  </motion.div>
                ))
              )}
            </div>
            {/* Next */}
            <button
              aria-label="Next"
              onClick={() => canNext && setStartIndex(startIndex + cardsPerPage)}
              disabled={!canNext}
              className={`bg-white/80 hover:bg-white rounded-full w-14 h-14 flex items-center justify-center text-3xl font-bold shadow-lg transition
                ${!canNext ? 'opacity-40 cursor-pointer' : 'cursor-pointer'}
                absolute right-0 top-1/2 -translate-y-1/2 z-10
                sm:static sm:translate-y-0
              `}
              style={{ zIndex: 2 }}
            >
              &gt;
            </button>
          </div>
          {/* Dua Box: Siaga dan Tentang CBM */}
          <div className="mt-8 w-full flex flex-col lg:flex-row gap-6 justify-center items-stretch max-w-6xl">
            {/* Box Siaga */}
            <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-6 text-gray-800">
              <h1 className="text-xl md:text-2xl font-bold text-blue-700 text-center mb-1">
                INFORMASI KESIAP–SIAGAAN BANJIR DAN HUJAN
              </h1>
              <p className="text-center text-sm md:text-base text-gray-600 mb-4">
                Wilayah Majalaya, Cekungan Bandung, & Sekitarnya
              </p>
              <div className="space-y-1 text-sm md:text-base text-center">
                <p>🕒 Prediksi: <span className="font-semibold">{jamPrediksi}</span></p>
                <p>🕒 Data Update: <span className="font-semibold">{jamPrediksiMinus30}</span></p>
                <p>🌡️ Probabilitas Hujan: <span className="font-semibold">{probabilitasHujan !== null ? `${(probabilitasHujan * 100).toFixed(1)}%` : 'Memuat...'}</span></p>
                <p>🌧️ Status: <span className={`font-semibold ${isSiaga ? 'text-red-600' : 'text-green-600'}`}>{statusSiaga}</span></p>
                <p>{statusCuaca === 'HUJAN' ? '🌧️' : '🌤️'} Status Cuaca: <span className="font-semibold">{statusCuaca}</span></p>
                <p>☁️ Potensi Awan Terdeteksi: <span className="font-semibold">{namaAwan}</span></p>
              </div>
              <div className={`mt-4 p-4 rounded-lg border ${isSiaga ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <h2 className="font-bold text-base md:text-lg mb-2 text-gray-800 text-center">🧭 Rekomendasi:</h2>
                <ul className={`list-disc list-inside text-sm text-center ${isSiaga ? 'text-red-600' : 'text-green-700'}`}>
                  {isSiaga ? (
                    <>
                      <li>Hindari daerah cekungan</li>
                      <li>Siapkan perlindungan hujan</li>
                      <li>Ikuti update CBM Satellite Weather System</li>
                    </>
                  ) : (
                    <>
                      <li>Cuaca terpantau aman</li>
                      <li>Selamat beraktivitas</li>
                      <li>Tetap waspada terhadap perubahan cuaca</li>
                    </>
                  )}
                </ul>
              </div>
              <div className="mt-4 text-right">
                <button
                  onClick={() => router.push('/Page_prediksi_hujan')}
                  className="text-sm font-medium text-blue-600 hover:underline hover:text-blue-800 transition"
                >
                  Info selengkapnya...
                </button>
              </div>
            </div>
            {/* Box Tentang CBM */}
            <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-6 flex flex-col items-center justify-center min-h-[460px]">
              <div className="w-full max-w-md text-center">
                {/* Judul */}
                <h2 className="text-xl sm:text-2xl font-extrabold text-blue-800 mb-4 tracking-wide">
                  TENTANG CBM SATELLITE WEATHER SYSTEM
                </h2>
                {/* Gambar GIF */}
                <div className="flex justify-center mb-4">
                  <Image
                    src="/gif/home.gif"
                    alt="CBM Weather Animation"
                    width={440}
                    height={440}
                    className="rounded-xl object-contain"
                  />
                </div>
                {/* Deskripsi */}
                <p className="text-sm sm:text-base leading-relaxed text-gray-800">
                  <span className="font-bold">CBM Satellite Weather System</span> adalah sistem prediksi cuaca yang dirancang khusus untuk wilayah <span className="font-bold">Cekungan Bandung dan Majalaya (CBM)</span>.
                  Sistem ini memprediksi cuaca 30 dan 60 menit lebih awal (lag 30 & lag 60 menit), dan akan terus diperbarui setiap 10 menit agar masyarakat selalu siap menghadapi perubahan cuaca secara real-time.
                </p>
              </div>
            </div>
          </div>
          {/* Footer */}
          <div className="mt-10 flex flex-col items-center text-center gap-4">
            <p className="text-white font-semibold text-lg">Download aplikasi CBM untuk Mobile</p>
            <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer">
              <Image src="/logos/PlayStore.png" alt="Playstore" width={160} height={48} />
            </a>
            <div className="flex gap-6 mt-4">
              <a href="https://www.linkedin.com/in/la-ode-muhammad-abin-akbar/" target="_blank" rel="noopener noreferrer">
                <Image src="/logos/Linkedin.png" alt="LinkedIn" width={32} height={32} />
              </a>
              <a href="https://pegasuseng.github.io/TerminalPromp/" target="_blank" rel="noopener noreferrer">
                <Image src="/logos/Github.png" alt="Github" width={32} height={32} />
              </a>
              <Link href="/Page_final_feedback">
                <Image src="/logos/Feedback.png" alt="Feedback" width={32} height={32} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
