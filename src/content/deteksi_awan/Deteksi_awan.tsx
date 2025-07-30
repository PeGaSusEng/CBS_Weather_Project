'use client';
import dynamic from 'next/dynamic';
import React, { useState, useEffect, useRef, useCallback,useMemo } from 'react';
import { useMap } from 'react-leaflet';
import { restartSchedulerVisibelAwan } from '@/utils/refresh';
import { fetchHimawariList, HimawariFrame } from '@/utils/fetchHimawari';
import { GeoJSON } from 'react-leaflet'; 
import debounce from 'lodash.debounce';
import { CircleMarker as LeafletCircleMarker, Tooltip } from 'react-leaflet';
import type { FeatureCollection } from 'geojson';



function InvalidateOnFrameChange({ frame }: { frame: any }) {
  const map = useMap();
  const debouncedInvalidate = React.useMemo(
    () => debounce(() => map.invalidateSize(), 100),
    [map]
  );

  useEffect(() => {
    debouncedInvalidate();
    return () => debouncedInvalidate.cancel();
  }, [debouncedInvalidate, frame]);

  return null;
}


const MemoizedImageOverlay = React.memo(
  (props: React.ComponentProps<typeof ImageOverlay>) => <ImageOverlay {...props} />,
  (prev, next) =>
    prev.url === next.url &&
    prev.opacity === next.opacity &&
    prev.zIndex === next.zIndex
);


MemoizedImageOverlay.displayName = 'MemoizedImageOverlay';

// ========== TIPE DATA ==========
export type CloudDot = {
  lat: number;
  lon: number;
  name: string;
  rgb: number[];
};

type LegendCategory = {
  name: string;
  rgb: number[];
  };
  
type CloudLegend = {
  [key: string]: LegendCategory[];
};


// ========== KONSTANTA ==========
const BOUNDS_INDO: [[number, number], [number, number]] = [
  [-11, 94],
  [25, 142]
];

const DEFAULT_ZOOM = 8;

const CLOUD_LEGEND: CloudLegend = {
  truecolor: [
    { name: "Awan tinggi yang terbentuk dari es", rgb: [77, 205, 205] },
    { name: "Awan rendah yang terdiri dari tetes air", rgb: [220, 200, 200] },
    { name: "Awan", rgb: [95, 245, 245] },
    { name: "Asap", rgb: [15, 95, 116] },
    { name: "Salju/Es", rgb: [21, 233, 221] }
  ],
  natural: [
    { name: "Awan", rgb: [95, 245, 245] },
    { name: "Asap", rgb: [15, 95, 116] },
    { name: "Awan tinggi yang terbentuk dari es", rgb: [77, 205, 205] },
    { name: "Awan rendah yang terdiri dari tetes air", rgb: [220, 200, 200] },
    { name: "Salju/Es", rgb: [21, 233, 221] }
  ]
};

// [minLon, minLat, maxLon, maxLat]
const AREA_EXTENT = {
  minLon: 107.58,
  minLat: -7.28,
  maxLon: 107.94,
  maxLat: -6.92
};


const wilayahList = [
  { name: "Majalaya", lat: -7.0515, lon: 107.7441 },
  { name: "Ibun", lat: -7.1124, lon: 107.7549 },
  { name: "Paseh", lat: -7.0807, lon: 107.7894 },
  { name: "Cikitu", lat: -7.058, lon: 107.727 }, 
  { name: "Nagrak_Pacet", lat: -7.085, lon: 107.721 }, 
  { name: "Cihaawuk", lat: -7.032, lon: 107.851 },
  { name: "Rancaekek", lat: -6.9807, lon: 107.7312 },  
  { name: "Solokanjeruk", lat: -7.0118, lon: 107.7468 },
  { name: "Pacet", lat: -7.1400, lon: 107.8200 },  
  { name: "Cikancung", lat: -7.0855, lon: 107.8300 },   
  { name: "Kertasari", lat: -7.2200, lon: 107.7500 },
  { name: "Ciparay", lat: -7.0025, lon: 107.7050 },
  { name: "Cileunyi", lat: -6.9500, lon: 107.7500 },
  { name: "Jatinangor", lat: -6.9985, lon: 107.8642 },  
  { name: "Arjasari", lat: -7.1100, lon: 107.6300 },
  { name: "Banjaran", lat: -7.0700, lon: 107.6100 },
  { name: "Baleendah", lat: -7.0050, lon: 107.6100 },
  { name: "Dayeuhkolot", lat: -6.9900, lon: 107.6100 },
  { name: "Rancasari", lat: -7.0300, lon: 107.7000 }, 
  { name: "Gedebage", lat: -6.9500, lon: 107.7000 },
  { name: "Cimanggung", lat: -6.9500, lon: 107.9000 },
  { name: "Buahbatu", lat: -6.9500, lon: 107.6700 },  
];

// ========== KOMPONEN DINAMIS ==========
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { 
    ssr: false,
    loading: () => <div className="text-white">Memuat peta...</div>
  }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const ImageOverlay = dynamic(
  () => import('react-leaflet').then((mod) => mod.ImageOverlay),
  { ssr: false }
);

const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const FungsiPlot = dynamic(() => import('./components/plot'), { 
  ssr: false,
  loading: () => <div className="text-white">Memuat analisis...</div>
});

// ========== KOMPONEN LIMIT BOUNDS ==========
const LimitBounds = () => {
  const map = useMap();
  const bounds = BOUNDS_INDO;

  useEffect(() => {
    if (!map) return;

    const leafletBounds = new (window as any).L.LatLngBounds(
      new (window as any).L.LatLng(bounds[0][0], bounds[0][1]),
      new (window as any).L.LatLng(bounds[1][0], bounds[1][1])
    );

    const checkBounds = () => {
      if (!leafletBounds.contains(map.getCenter())) {
        map.panInsideBounds(leafletBounds, { animate: true });
      }
    };

    map.on('moveend', checkBounds);
    return () => {
      map.off('moveend', checkBounds);
    };
  }, [map, bounds]);

  return null;
};

function MapEvents({ onMap }: { onMap: (m: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    onMap(map);
  }, [map, onMap]);
  return null;
}
// ========== KOMPONEN UTAMA ==========
export default function FullMapPage() {
  const [leaflet, setLeaflet] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [wilayahIcon, setWilayahIcon] = useState<any>(null);
  const [mode, setMode] = useState<'truecolor' | 'natural'>('truecolor');
  const [isPlaying, setIsPlaying] = useState(false);
  const [frames, setFrames] = useState<HimawariFrame[]>([]);
  const [current, setCurrent] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [notif, setNotif] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(true);
  const [showGeojson, setShowGeojson] = useState(true);
  const [showCloudDetection, setShowCloudDetection] = useState(false);
  const [showWilayahDots, setShowWilayahDots] = useState(false);
  const [showAnalisis, setShowAnalisis] = useState(false);
  const [cloudDots, setCloudDots] = useState<CloudDot[]>([]);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [showGoogle, setShowGoogle] = useState(false);
  const [geojsonData, setGeojsonData] = useState<FeatureCollection | null>(null);
  const [map, setMap] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mapRef = useRef<any>(null);
  const [imageBounds, setImageBounds] = useState<any>(null);
  const imageCache = useRef<Record<string, HTMLImageElement>>({});
  const overlayRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const legendItems = CLOUD_LEGEND[mode];
  const animRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const imgCache = useRef<Record<string, HTMLImageElement>>({})

   // ========== ANIMASI FRAME ========== 
   const frame = frames.length ? frames[current] : undefined;
   const overlayUrl = useMemo(() => {
      if (!frame) return ''
      return `/api/image_frame_himawari?filename=${encodeURIComponent(frame.filename)}`
    }, [frame?.filename])

  useEffect(() => {
    // Misal fetchHimawariList sudah set state frames
    frames.forEach(f => {
      // hanya preload sekali per filename
      if (!imgCache.current[f.filename]) {
        const img = new Image()
        img.crossOrigin = 'Anonymous'
        img.src = `/api/image_frame_himawari?filename=${encodeURIComponent(f.filename)}`
        img.decode().catch(() => {})  // optional: tunggu decode
        imgCache.current[f.filename] = img
      }
    })
  }, [frames])


  const getData = useCallback(async () => {
    const data: HimawariFrame[] = await fetchHimawariList();
    const filtered = data.filter(f =>
      mode === 'truecolor' ? f.filename.startsWith('tr_color_') : f.filename.startsWith('ntr_color_')
    );
    setFrames(filtered);
    setLoading(false);

      filtered.forEach(f => {
        if (!imageCache.current[f.filename]) {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.src = `/api/image_frame_himawari?filename=${encodeURIComponent(f.filename)}`;
          imageCache.current[f.filename] = img;
        }
      });

    if (filtered.length > 0 && !hasInteracted) {
      setCurrent(filtered.length - 1);
    }
  }, [mode, hasInteracted]);

  useEffect(() => {
    getData();
    const interval = setInterval(getData, 60000);
    return () => clearInterval(interval);
  }, [getData]);

  useEffect(() => {
    if (!overlayRef.current || !frame) return;
    overlayRef.current.setUrl(
      `/api/image_frame_himawari?filename=${encodeURIComponent(frame.filename)}`
    );
  }, [frame]);

//  useEffect(() => {
    //if (!frame || !isClient || !showCloudDetection) return;
    //const canvas = canvasRef.current;
    //if (!canvas) return;
    //const ctx = canvas.getContext('2d');
    //if (!ctx) return;

    //let alive = true;

    //(async () => {
      //try {
        // 1. Ambil PNG sebagai Blob
        //const res = await fetch(overlayUrl, { cache: 'no-store' });
        //const blob = await res.blob();

        // 2. Buat ImageBitmap (decode + upload GPU lebih cepat)
        //const bitmap = await createImageBitmap(blob);
        //if (!alive) return;

        // 3. Set ukuran canvas & gambar bitmap-nya
        //canvas.width = bitmap.width;
        //canvas.height = bitmap.height;
        //ctx.drawImage(bitmap, 0, 0);

        // 4. Ambil data piksel seperti sebelumnya
        //const data = ctx.getImageData(0, 0, bitmap.width, bitmap.height).data;
        //const legend = CLOUD_LEGEND[mode];
        //const [south, west] = BOUNDS_INDO[0];
        //const [north, east] = BOUNDS_INDO[1];
        //const imgW = bitmap.width, imgH = bitmap.height;

        // hitung batas pixel X/Y
        //const xMin = Math.floor(((AREA_EXTENT.minLon - west) / (east - west)) * imgW);
        //const xMax = Math.ceil (((AREA_EXTENT.maxLon - west) / (east - west)) * imgW);
        //const yMin = Math.floor(imgH - ((AREA_EXTENT.maxLat - south) / (north - south)) * imgH);
        //const yMax = Math.ceil (imgH - ((AREA_EXTENT.minLat - south) / (north - south)) * imgH);

        // struktur kategori & template yg sama
        //const categories = legend.map(cat => ({ ...cat, pixels: [] as { x: number; y: number }[] }));
        //const templates = legend.map(cat => {
          //const [R, G, B] = cat.rgb;
          //return { ...cat, norm: Math.hypot(R, G, B) };
        //});

        // loop deteksi piksel
        //const angleThresh = 0.15;
        //for (let i = 0; i < data.length; i += 4) {
          //const r = data[i], g = data[i+1], b = data[i+2];
          //const idx = i / 4;
          //const x = idx % imgW, y = Math.floor(idx / imgW);
          //if (x < xMin || x > xMax || y < yMin || y > yMax) continue;
          //const pixNorm = Math.hypot(r, g, b);
          //if (!pixNorm) continue;

          //let bestIdx = -1, bestAngle = Infinity;
          //templates.forEach((tpl, j) => {
            //const dot = r*tpl.rgb[0] + g*tpl.rgb[1] + b*tpl.rgb[2];
            //const cosθ = dot/(pixNorm * tpl.norm);
            //const angle = Math.acos(Math.min(1, Math.max(-1, cosθ)));
            //if (angle < bestAngle) {
              //bestAngle = angle;
              //bestIdx = j;
            //}
          //});
          //if (bestIdx >= 0 && bestAngle <= angleThresh) {
            //categories[bestIdx].pixels.push({ x, y });
          //}
        //}

        // sampling & konversi ke lat/lng
        //const markers: CloudDot[] = [];
        //const PIXEL_LIMIT = 100;
        //categories.forEach(cat => {
          //cat.pixels
            //.sort(() => 0.5 - Math.random())
            //.slice(0, PIXEL_LIMIT)
            //.forEach(({ x, y }) => {
              //const [lat, lon] = pixelToLatLng(x, y, imgW, imgH);
              //markers.push({ lat, lon, name: cat.name, rgb: cat.rgb });
            //});
        //});

        //setCloudDots(markers);
      //} catch (err) {
        //console.error('Error fetching/bitmap:', err);
        //if (alive) setCloudDots([]);
      //}
    //})();

    //return () => {
      //alive = false;
    //};
  //}, [frame, mode, overlayUrl, showCloudDetection, isClient]);

    // ====== LOAD GARIS PANTAI ========
    useEffect(() => {
      if (showGeojson) {
        loadGeojson();
      } else {
        setGeojsonData(null);
      }
    }, [showGeojson]);

  useEffect(() => {
    if (!isPlaying || frames.length === 0) {
      // kalau berhenti, batalkan animasi
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    // reset penanda waktu awal
    lastTimeRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - lastTimeRef.current;
      // setiap 2 detik (2000 ms) maju ke frame berikutnya
      if (elapsed >= 2000) {
        setCurrent(prev => (prev + 1) % frames.length);
        lastTimeRef.current = now;
      }
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);

    // cleanup saat unmount atau isPlaying berubah
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, frames.length]);

  // ========== INISIALISASI LEAFLET ==========
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: '',
        });
        setLeaflet(L);
        setWilayahIcon(new L.Icon({
          iconUrl: '',
          iconSize: [80, 71],
          iconAnchor: [50, 41],
          popupAnchor: [0, -41],
          shadowSize: [41, 41],
        }));
      });
    }
  }, []);


  // ========== FUNGSI UTILITAS ==========
  const pixelToLatLng = (x: number, y: number, imgW: number, imgH: number): [number, number] => {
    const minLat = Math.min(BOUNDS_INDO[0][0], BOUNDS_INDO[1][0]);
    const maxLat = Math.max(BOUNDS_INDO[0][0], BOUNDS_INDO[1][0]);
    const minLon = Math.min(BOUNDS_INDO[0][1], BOUNDS_INDO[1][1]);
    const maxLon = Math.max(BOUNDS_INDO[0][1], BOUNDS_INDO[1][1]);
    const lat = minLat + ((imgH - y) / imgH) * (maxLat - minLat);
    const lon = minLon + (x / imgW) * (maxLon - minLon);
    return [lat, lon];
  };

  // ========== HANDLER UI ==========

    const loadGeojson = async () => {
      const urls = [
        '/geojson/Indo.json', 
        '/geojson/gabung_2.json',
        '/geojson/gabung_3.json',
        '/geojson/gabung_4.json',
        '/geojson/gabung_5.json',
        '/geojson/gabung.json',
        '/geojson/Ibun.json',
        '/geojson/Majalaya.json',
        '/geojson/Mekarjaya.json',
        '/geojson/Pacet.json',
        '/geojson/Cikaroya_Majalaya_sekitarnya.json'
      ];
      const datasets = await Promise.all(urls.map(u => fetch(u).then(r => r.json())));
      const merged: FeatureCollection = {
        type: 'FeatureCollection',
        features: datasets.flatMap((d: any) => d.features),
      };
      setGeojsonData(merged);
    };



  const handleMode = () => {
    const newMode = mode === 'truecolor' ? 'natural' : 'truecolor';
    setMode(newMode);
    setTimeout(() => {
      setNotif(`Mode: ${newMode === "truecolor" ? "True Color" : "Natural Color"}`);
      setTimeout(() => {
        setNotif(""); 
      }, 2000); 
    }, 1000); 
  };


  const handleCloud = () => {
    setShowCloudDetection(prev => {
      setTimeout(() => {
        setNotif(`Object Detector: ${!prev ? "ON" : "OFF"}`);
        setTimeout(() => {
          setNotif(""); 
        }, 2000);
      }, 1000); 
      return !prev;
    });
  };


  const handleWilayah = () => {
    setShowWilayahDots(prev => {
      setTimeout(() => {
        setNotif(`Titik Lokasi: ${!prev ? "ON" : "OFF"}`);
        setTimeout(() => {
          setNotif("");
        }, 2000);
      }, 1000); 
      return !prev;
    });
  };


  const handleCoast = () => {
    setShowGeojson(prev => {
      setTimeout(() => {
        setNotif(`Coastline Map: ${!prev ? "ON" : "OFF"}`);
        setTimeout(() => {
          setNotif(""); 
        }, 2000); 
      }, 1000); 
      return !prev;
    });
  };


  const handleAnalisis = () => {
    setShowAnalisis(prev => {
      setTimeout(() => {
        setNotif(`Data Awan Model: ${!prev ? "ON" : "OFF"}`);
        setTimeout(() => {
          setNotif("");
        }, 2000); 
      }, 1000); 
      return !prev;
    });
  };


  const handleRefresh = () => {
    restartSchedulerVisibelAwan()
      .then(res => {
        setNotif(res.status === "success" ? "Refresh berhasil!" : `Refresh gagal: ${res.msg || "Unknown error"}`);
        setTimeout(() => setNotif(null), 2000);
      })
      .catch(() => {
        setNotif("Terjadi error saat refresh");
        setTimeout(() => setNotif(null), 2000);
      });
  };

  const handlePlayPause = () => {
    setIsPlaying(prev => {
      setHasInteracted(true);
      setTimeout(() => {
        setNotif(prev ? "Animasi dihentikan" : "Animasi dimulai");
        setTimeout(() => {
          setNotif(""); 
        }, 2000); 
      }, 1000); 
      return !prev;
    });
  };


  const handlePrev = () => {
    setHasInteracted(true);
    setCurrent(prev => (prev - 1 + frames.length) % frames.length);
  };

  const handleNext = () => {
    setHasInteracted(true);
    setCurrent(prev => (prev + 1) % frames.length);
  };


  // jika masih loading, tampilkan full‐screen spinner
 if (loading) {
   return (
      <div className="flex items-center justify-center w-full h-screen bg-gray-950">
        <div className="text-white text-lg">Memuat data dan peta…</div>
      </div>
   );
  }

 
  if (!isClient || !leaflet || !wilayahIcon) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-gray-950">
        <div className="text-white text-lg">Memuat peta...</div>
      </div>
    );
  }

  if (!frame) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-gray-950">
        <div className="text-white text-lg">Memuat data satelit...</div>
      </div>
    );
  }



 
const MenuIcon = () => (
  <svg width="26" height="26" fill="none">
    <circle cx="13" cy="13" r="13" fill="#fff" fillOpacity=".2" />
    <rect x="7" y="10" width="12" height="2" rx="1" fill="#222" />
    <rect x="7" y="14" width="12" height="2" rx="1" fill="#222" />
  </svg>
);

const TrueColorIcon = () => (
  <span className="inline-block w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold mr-1 text-xs border-2 border-blue-400">H</span>
);

const CloudIcon = () => (
  <svg width="24" height="24" fill="none"><circle cx="12" cy="12" r="11" fill="#B39DDB"/><ellipse cx="12" cy="19" rx="7" ry="4" fill="#fff"/><ellipse cx="16" cy="12" rx="4" ry="2" fill="#fff"/></svg>
);

const DotsIcon = () => (
  <svg width="24" height="24" fill="none"><circle cx="12" cy="12" r="10" fill="#81C784"/><circle cx="12" cy="12" r="5" fill="#43A047"/></svg>
);

const CoastIcon = () => (
  <svg width="24" height="24" fill="none"><rect x="4" y="14" width="16" height="4" rx="2" fill="#26C6DA"/><rect x="4" y="9" width="16" height="4" rx="2" fill="#4DD0E1"/></svg>
);

const AnalisisIcon = () => (
  <svg width="24" height="24" fill="none"><circle cx="12" cy="12" r="10" fill="#80DEEA"/><rect x="7" y="8" width="2.5" height="8" rx="1.25" fill="#00ACC1"/><rect x="11" y="11" width="2.5" height="5" rx="1.25" fill="#00ACC1"/><rect x="15" y="9" width="2.5" height="7" rx="1.25" fill="#00ACC1"/></svg>
);

const PrevIcon = () => (
  <svg width="32" height="32" fill="none"><path d="M20 10l-6 6 6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

const NextIcon = () => (
  <svg width="32" height="32" fill="none"><path d="M12 10l6 6-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

const PlayIcon = () => (
  <svg width="32" height="32" fill="none"><circle cx="16" cy="16" r="15" fill="#fff" fillOpacity=".1"/><polygon points="13,11 23,16 13,21" fill="#fff"/></svg>
);

const PauseIcon = () => (
  <svg width="32" height="32" fill="none"><circle cx="16" cy="16" r="15" fill="#fff" fillOpacity=".1"/><rect x="13" y="12" width="2.8" height="8" rx="1.3" fill="#fff"/><rect x="17" y="12" width="2.8" height="8" rx="1.3" fill="#fff"/></svg>
);

const RefreshIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    style={{ display: "block" }}
  >
    <path
      d="M4.93 4.93a10 10 0 0 1 14.14 0M19 4v5h-5"
      stroke="#009fb7"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19.07 19.07a10 10 0 0 1-14.14 0M5 20v-5h5"
      stroke="#009fb7"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
  
  return (
    <div className="relative w-full min-h-screen bg-gray-950 overflow-hidden">
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {/* Legend */}
     {!showAnalisis && (
       <div
          className="
            fixed top-[98px] left-4 z-50
            hidden sm:flex flex-col gap-2
            bg-black bg-opacity-60 p-4 rounded-lg
            max-w-xs md:max-w-sm
          "
        >
          <h3 className="text-white font-semibold text-lg">Keterangan</h3>
          <ul className="list-disc list-inside text-white text-sm space-y-1 mt-2">
            <li>◻️ Langit Cerah → area tanpa awan</li>
            <li>🌫️ Awan Tipis → noda putih samar</li>
            <li>☁️ Awan Campuran → gumpalan awan sedang</li>
            <li>🌩️ Cumulonimbus (Cb) → tonjolan awan gelap/tebal</li>
          </ul>
          <p className="text-white text-xs italic mt-3">
            Sumber: Introduction Himawari-8 RGB Composite
          </p>
       </div>
     )}


   
      <div className="absolute top-[68px] left-0 right-0 bottom-0 z-0">
        <MapContainer
          center={[-7.05, 107.75]}
          zoom={DEFAULT_ZOOM}
          minZoom={6}
          maxZoom={15}
          ref={mapRef} 
          zoomControl={false}
          maxBounds={BOUNDS_INDO}
          maxBoundsViscosity={1.0}
          scrollWheelZoom={true}
          dragging={true}
          className="w-full h-[100vh] min-h-[230px]"
        >
          <MapEvents onMap={setMap}/>
          <LimitBounds />

          <InvalidateOnFrameChange frame={frame} />
          
          {!showGoogle ? (
            <TileLayer
              url="https://basemaps.cartocdn.com/dark_nolabel/{z}/{x}/{y}{r}.png"
              attribution="© OpenStreetMap"
            />
          ) : (
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              attribution="© Google Maps"
            />
          )}

          
          <MemoizedImageOverlay
            ref={overlayRef}
            url={overlayUrl}
            bounds={BOUNDS_INDO}
            opacity={0.8}
            zIndex={10}
          />
          

         
          {showWilayahDots && wilayahList.map(w => (
            <CircleMarker
              key={w.name}
              center={[w.lat, w.lon]}
              radius={6}
              pathOptions={{ color: '#FFD700', fillColor: '#FFD700', fillOpacity: 1 }}
            >
              <Tooltip direction="right" offset={[8, 0]} permanent>
                <span className="font-bold text-sm">{w.name}</span>
              </Tooltip>
            </CircleMarker>
          ))}


      
          {showCloudDetection && cloudDots.map((dot, idx) => (
            <CircleMarker
              key={idx}
              center={[dot.lat, dot.lon]}
              radius={10}
              color="#fff"
              weight={2}
              fillOpacity={0.9}
              fillColor={`rgb(${dot.rgb.join(",")})`}
            >
              <Popup>
                <span className="font-bold text-[13px] sm:text-base" style={{ color: `rgb(${dot.rgb.join(",")})` }}>
                  {dot.name}
                </span>
              </Popup>
            </CircleMarker>
          ))}
        {showGeojson && geojsonData && (
          <GeoJSON data={geojsonData} />
        )}
        </MapContainer>
      </div>
 
      <div className="fixed top-[104px] right-2 z-40 flex flex-col items-end gap-2 md:gap-5">
        <button
          className="w-12 h-12 md:w-[62px] md:h-[62px] rounded-full bg-white/60 hover:bg-white shadow-xl flex items-center justify-center border-2 border-white/80"
          style={{ boxShadow: '0 6px 24px #0002' }}
          onClick={() => setMenuOpen(o => !o)}
        >
          <MenuIcon />
        </button>
        {menuOpen && (
          <div className="relative">
            <div className="absolute inset-0 bg-black/70 rounded-3xl shadow-2xl" style={{ zIndex: 1 }} />
            <div className="relative flex flex-col gap-2 md:gap-3 items-end z-10 p-3 md:p-4">
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold shadow bg-white/90 border-2 border-blue-200 text-[13px] md:text-base text-cyan-700`}
                onClick={handleMode}
              >
                <TrueColorIcon />
                <span>{mode === 'truecolor' ? 'True Color' : 'Natural Color'}</span>
              </button>
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold border-2 text-[13px] md:text-base ${showWilayahDots ? 'bg-green-200 border-green-600 text-green-800' : 'bg-white/80 border-green-300 text-cyan-700'}`}
                onClick={handleWilayah}
              >
                <DotsIcon />
                <span>Titik Lokasi</span>
              </button>
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold border-2 text-[13px] md:text-base ${showGeojson ? 'bg-yellow-100 border-cyan-600 text-cyan-800' : 'bg-white/80 border-cyan-200 text-cyan-700'}`}
                onClick={handleCoast}
              >
                <CoastIcon />
                <span>Coastline Map</span>
              </button>
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold border-2 text-[13px] md:text-base ${showAnalisis ? 'bg-blue-100 border-cyan-600 text-cyan-800' : 'bg-white/80 border-cyan-200 text-cyan-700'}`}
                onClick={handleAnalisis}
              >
                <AnalisisIcon />
                <span>Data Awan Model</span>
              </button>
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold border-2 text-[13px] md:text-base ${showAnalisis ? 'bg-cyan-100 border-cyan-600 text-cyan-800' : 'bg-white/80 border-cyan-200 text-cyan-700'}`}
                onClick={handleRefresh}
              >
                <RefreshIcon />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        )}
      </div>


      {!showAnalisis && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-[42px] z-40 flex flex-col items-center w-[97vw] max-w-[440px]">
          <div className="flex items-center bg-black/80 rounded-2xl px-2 sm:px-7 py-2 gap-1 sm:gap-2 shadow-xl w-full justify-between">
            <button
              onClick={handlePrev}
              disabled={frames.length === 0}
              aria-label="Prev"
              className="p-1 rounded-full hover:bg-white/10 transition"
            >
              <PrevIcon />
            </button>
            <button
              onClick={handlePlayPause}
              className="p-1 rounded-full hover:bg-white/10 transition"
              aria-label="Play/Pause"
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button
              onClick={handleNext}
              disabled={frames.length === 0}
              aria-label="Next"
              className="p-1 rounded-full hover:bg-white/10 transition"
            >
              <NextIcon />
            </button>
            <div key={frame?.datetime} className="ml-1 sm:ml-3 font-semibold text-white text-[12px] sm:text-lg tracking-wide whitespace-nowrap min-w-[70px] sm:min-w-[120px] text-right">
              {frame?.datetime || "--"} <span className="text-[9px] sm:text-xs">WIB</span>
            </div>
          </div>
          <div className="mt-2 mb-4 text-white text-[11px] sm:text-xs text-center opacity-90 drop-shadow-sm select-none pointer-events-none">
            © Japan Meteorological Agency – Data Satelit Himawari
          </div>
        </div>
      )}


      {notif && (
        <div className="fixed top-[120px] left-1/2 -translate-x-1/2 z-50">
          <div className="px-5 py-2 rounded-2xl bg-[#333]/95 text-white text-base sm:text-lg font-bold shadow-2xl animate-fadein text-center min-w-[170px] sm:min-w-[220px]">
            {notif}
          </div>
        </div>
      )}


      {showAnalisis && (
        <div className="fixed inset-x-0 flex items-start justify-start px-2 sm:px-4 mt-16">
          <div className="relative flex flex-col rounded-2xl w-full max-w-[90%] sm:max-w-3xl md:max-w-4xl xl:max-w-4xl p-3 sm:p-5 md:p-8 overflow-hidden">
            <div className="w-full mb-4">
              <FungsiPlot />
            </div>
          </div>
        </div>
      )} 
    </div>
  );
}