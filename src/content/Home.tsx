'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/navigation';


const formatNowWIB = () => {
  const now = new Date();
  const hh = now.getHours().toString().padStart(2, '0');
  const mm = now.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm} WIB`;
};

const labelProbabilitas = (prob: number | null) => {
  if (prob === null) return 'Memuat...';
  if (prob < 0.5) {
    return 'Tidak hujan';
  }
  if (prob < 0.8) {
    return 'Hujan Rendah';
  }
  if (prob < 0.95) {
    return 'Hujan Sedang';
  }
  return 'Hujan Tinggi';
};






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
  probabilitas_hujan?: number;
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
  const [showWelcome, setShowWelcome] = useState(true);
  const [tanggalPrediksi, setTanggalPrediksi] = useState<string>('');
  const router = useRouter();


  const [startIndex, setStartIndex] = useState(0);
  const [cardsPerPage, setCardsPerPage] = useState(4);

  
  const [currentTime, setCurrentTime] = useState<string>(formatNowWIB());
  const [showAll, setShowAll] = useState(false);

 
  useEffect(() => {
    const iv = setInterval(() => setCurrentTime(formatNowWIB()), 60_000);
    return () => clearInterval(iv);
  }, []);


 
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


  useEffect(() => {
    const fetchData = async () => {
      try {
       
        const [res30, res60] = await Promise.all([
          fetch('/api/info_prakiraan_cuaca_lag_30'),
          fetch('/api/info_prakiraan_cuaca_lag_60'),
        ]);
        const [json30, json60] = await Promise.all([res30.json(), res60.json()]);


        const arr30 = (json30 && typeof json30 === 'object')
          ? Object.values(json30).flat() as Prediksi[]
          : [];
        const arr60 = (json60 && typeof json60 === 'object')
          ? Object.values(json60).flat() as Prediksi[]
          : [];

        const allPrediksi = [...arr30, ...arr60]
                 .sort((a, b) => {
         const da = parseWIB(a.waktu);
         const db = parseWIB(b.waktu);
           if (!da || !db) return 0;
           return da.getTime() - db.getTime();
         });

        setData(allPrediksi);
      } catch (err) {
        setData([]); 
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

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


  const now = new Date();
  const filteredData = data.filter(item => {
    const t = parseWIB(item.waktu);
    return t && t >= now;
});



  const displayedData = showAll
    ? filteredData.slice(startIndex, startIndex + cardsPerPage)
    : filteredData.slice(0, 1);


  const canPrev = startIndex > 0;
  const canNext = startIndex + cardsPerPage < filteredData.length;


  const adaHujan = filteredData.some(item => item.cuaca?.toLowerCase() === 'hujan');
  const tidakHujan = filteredData.some(item => item.cuaca?.toLowerCase() === 'cerah');

  const getImageByCuaca = (cuaca: string, waktu: string) => {
    const jam = parseInt(waktu.split(':')[0]);
    const isNight = jam >= 18 || jam < 6;
    const cuacaLower = cuaca.toLowerCase();
    if (cuacaLower === 'hujan') return isNight ? '/logos/hujan_malam.png' : '/logos/hujan_pagi.png';
    if (cuacaLower === 'cerah') return isNight ? '/logos/cerah_malam.png' : '/logos/cerah_pagi.png';
    return '/image/default.png';
  };
  const nearestHujan = filteredData.find(item => item.cuaca.toLowerCase() === 'hujan');
  const rainStatus = nearestHujan ? 'HUJAN' : 'TIDAK ADA HUJAN';
  return (
    <>
      <FontLoader />
      <Head>
        <title>CBS-Weather-System</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      {showWelcome ? (
          <div className="relative w-full min-h-screen flex items-center justify-center bg-weather bg-cover bg-center px-4">
            <div
              className="
                absolute inset-0
                bg-gradient-to-tr from-purple-500 via-pink-400 to-blue-400
                bg-[length:300%_300%] animate-gradient-pan
              "
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="
                relative z-10
                w-full
                sm:w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 2xl:w-2/5
                p-6 sm:p-8
                bg-white/20 backdrop-blur-xl
                border border-white/30
                rounded-3xl shadow-2xl
                text-center
                transition-transform hover:scale-[1.02] duration-300
              "
            >
            <h1
              className="
                text-3xl sm:text-4xl lg:text-5xl
                font-extrabold
                bg-gradient-to-r from-purple-400 via-pink-500 to-red-600
                bg-clip-text text-transparent
                bg-[length:200%_auto] bg-[position:0%_center]
                hover:bg-[position:100%_center]
                transition-all duration-2000 ease-out
                drop-shadow-lg
                mb-4
              "
            >
              Selamat datang di Sistem Cuaca CBS
            </h1>


              <p className="mb-6 text-sm sm:text-base text-white/90 leading-relaxed filter drop-shadow-md">
                CBS Weather System adalah layanan prakiraan cuaca berbasis satelit yang dirancang khusus untuk wilayah Cekungan Bandung, dengan pembaruan data setiap 10 menit dan prediksi cuaca real-time hingga satu jam ke depan. Pantau aktivitas, atur notifikasi instan, rencanakan hari dengan tenang, dan nikmati momen luar ruang tanpa khawatir!
              </p>
              <button
                onClick={() => setShowWelcome(false)}
                className="
                  inline-block
                  px-8 py-3 sm:px-10 sm:py-4
                  rounded-full
                  bg-gradient-to-r from-blue-500 to-teal-400
                  text-white font-semibold
                  relative overflow-hidden
                  before:absolute before:inset-0 before:bg-white/20 before:scale-0
                  hover:before:scale-100 hover:before:opacity-0
                  transition-all duration-300
                  shadow-lg
                  focus:outline-none focus:ring-4 focus:ring-blue-300/50
                "
              >
                Klik Disini
              </button>
            </motion.div>
          </div>
      ) : (
        <div className="relative w-full min-h-screen overflow-y-auto bg-weather bg-cover bg-center px-4 py-2 pt-24 pb-32 flex flex-col items-center">
        <div className="w-full flex flex-col items-center justify-start">
          <div className="w-full max-w-md mx-auto mb-8 p-6 sm:p-8 bg-gradient-to-r from-blue-600 to-teal-500 rounded-3xl shadow-2xl backdrop-blur-lg border border-white/20">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white text-center drop-shadow-lg">
              Prakiraan Cuaca
            </h1>

            <p className="mt-1 text-sm sm:text-base text-white/90 text-center">
              {tanggalPrediksi}
            </p>

            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
              <span className="text-2xl font-semibold text-white">
                Waktu kini : {currentTime}
              </span>
              <span className="px-3 py-1 bg-red-600 text-white uppercase text-xs font-medium rounded-full drop-shadow">
                {rainStatus}
              </span>
            </div>
          </div>

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
          <div className="w-full mb-4 flex justify-center">
            <button
              onClick={() => setShowAll(prev => !prev)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
            >
              {showAll ? 'Sembunyikan' : 'Selengkapnya'}
            </button>
          </div>
          {!showAll ? (
            <div className="w-full flex justify-center my-6">
              {displayedData.map((item, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.06, y: -6, boxShadow: "0 8px 32px #1115" }}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.06 }}
                  className="
                    snap-center flex-shrink-0
                    w-[80vw] sm:w-[45vw] md:w-[30vw] lg:w-[22vw]
                    bg-blue-transparent backdrop-blur-md rounded-2xl
                    p-5 pb-7 min-h-[340px] flex flex-col items-center
                    justify-between shadow-lg border border-white/30
                  "
                >
                  {labelProbabilitas(probabilitasHujan) !== 'Tidak hujan' && (
                    <span className="absolute top-2 right-2 text-blue-900 text-xs font-semibold px-2 py-1 rounded shadow-md">
                    </span>
                  )}
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Image
                      src={getImageByCuaca(item.cuaca, item.waktu)}
                      alt={item.cuaca}
                      width={200}
                      height={200}
                      className="drop-shadow-md"
                    />
                  </motion.div>
                  <div className="mb-4 mt-2">
                    <p className="text-base text-white drop-shadow">{item.waktu}</p>
                    <p className="font-bold uppercase text-2xl text-black drop-shadow">{item.cuaca}</p>
                  </div>
                  <button
                    onClick={() => router.push(`/Page_deteksi_awan`)}
                    className="text-xs text-blue-800 font-bold bg-white/40 hover:bg-white/70 px-3 py-1 rounded transition border border-white/30 shadow"
                  >
                    Detail
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="relative w-full my-4">
              <button
                aria-label="Prev"
                onClick={() => canPrev && setStartIndex(startIndex - cardsPerPage)}
                disabled={!canPrev}
                className={`
                  absolute top-1/2 left-2 transform -translate-y-1/2
                  bg-white/80 hover:bg-white rounded-full p-2 shadow z-10
                  ${!canPrev ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >‹</button>

              <div
                className="
                  overflow-x-auto overflow-y-hidden scrollbar-hide
                  scroll-smooth snap-x snap-mandatory flex gap-6
                  px-[10vw]      /* mobile: half of (100 - 80) = 10vw */
                  lg:px-0
                  lg:overflow-visible
                  lg:flex-wrap 
                  lg:justify-center
                  lg:snap-none
                "
              >
                {displayedData.map((item, idx) => (
                  <motion.div
                    key={idx}
                    className="
                      snap-center flex-shrink-0
                      w-[80vw] sm:w-[45vw] md:w-[30vw] lg:w-[22vw]
                      bg-blue-transparent backdrop-blur-md rounded-2xl
                      p-5 pb-7 min-h-[340px] flex flex-col items-center
                      justify-between shadow-lg border border-white/30
                    "
                  >
                    {labelProbabilitas(probabilitasHujan) !== 'Tidak hujan' && (
                      <span className="absolute top-2 right-2 text-blue-900 text-xs font-semibold px-2 py-1 rounded shadow-md">
                      </span>
                    )}
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
                    <div className="mb-4 mt-2">
                      <p className="text-base text-white drop-shadow">{item.waktu}</p>
                      <p className="font-bold uppercase text-2xl text-black drop-shadow">{item.cuaca}</p>
                    </div>
                    <div className="w-full text-center text-sm text-black/90 leading-relaxed font-medium mb-3 space-y-0.5">
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
                ))}
              </div>
              <button
                aria-label="Next"
                onClick={() => canNext && setStartIndex(startIndex + cardsPerPage)}
                disabled={!canNext}
                className={`
                  absolute top-1/2 right-2 transform -translate-y-1/2
                  bg-white/80 hover:bg-white rounded-full p-2 shadow z-10
                  ${!canNext ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >›</button>
            </div>
          )}


          {showAll && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="
                w-full max-w-4xl mx-auto mt-6
                bg-gradient-to-r from-purple-600 to-indigo-500
                text-white p-8 rounded-3xl shadow-2xl
                backdrop-blur-md border border-white/20
              "
            >
              <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-6 drop-shadow">
                 Deskripsi<span className="text-yellow-300"> Waktu Prakiraan</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="
                    flex flex-col items-center p-4
                    bg-white/20 rounded-2xl
                    backdrop-blur-sm border border-white/30
                  "
                >
                  <span className="text-4xl mb-2">🕒</span>
                  <h3 className="font-semibold mb-1">Valid Time</h3>
                  <p className="text-sm text-center">
                    Waktu di mana prediksi cuaca ini berlaku.
                  </p>
                </motion.div>


                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="
                    flex flex-col items-center p-4
                    bg-white/20 rounded-2xl
                    backdrop-blur-sm border border-white/30
                  "
                >
                  <span className="text-4xl mb-2">🛰️</span>
                  <h3 className="font-semibold mb-1">Satellite Time</h3>
                  <p className="text-sm text-center">
                    Waktu saat citra satelit diambil.
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="
                    flex flex-col items-center p-4
                    bg-white/20 rounded-2xl
                    backdrop-blur-sm border border-white/30
                  "
                >
                  <span className="text-4xl mb-2">📡</span>
                  <h3 className="font-semibold mb-1">Issue Time</h3>
                  <p className="text-sm text-center">
                    Waktu saat data prediksi diterbitkan.
                  </p>
                </motion.div>
              </div>
            </motion.div>
          )}


          <div className="mt-8 w-full flex flex-col lg:flex-row gap-6 justify-center items-stretch max-w-6xl">
            <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-6 text-gray-800">
              <h1 className="text-xl md:text-2xl font-bold text-blue-700 text-center mb-1">
                INFORMASI KESIAP–SIAGAAN BANJIR DAN HUJAN
              </h1>
              <p className="text-center text-sm md:text-base text-gray-600 mb-4">
                Wilayah Cekungan Bandung, & Sekitarnya
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
                      <li>Ikuti update CBS Weather System</li>
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
            <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-6 flex flex-col items-center justify-center min-h-[460px]">
              <div className="w-full max-w-md text-center">
                <h2 className="text-xl sm:text-2xl font-extrabold text-blue-800 mb-4 tracking-wide">
                  TENTANG CBS WEATHER SYSTEM
                </h2>
                <div className="flex justify-center mb-4">
                  <Image
                    src="/gif/home.gif"
                    alt="CBM Weather Animation"
                    width={440}
                    height={440}
                    className="rounded-xl object-contain"
                  />
                </div>
                <p className="text-sm sm:text-base leading-relaxed text-gray-800">
                  <span className="font-bold">CBS Weather System</span> adalah layanan prakiraan cuaca khusus untuk wilayah <span className="font-bold">Cekungan Bandung dan sekitarnya</span>. 
                  Sistem ini dapat memprediksi cuaca hingga satu jam ke depan, dan diperbarui setiap 10 menit agar Anda selalu mendapatkan informasi terbaru secara real-time.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center text-center gap-4">
            <p className="text-white font-semibold text-lg">Download aplikasi CBS untuk Mobile</p>
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
      )}
    </>
  );
}
