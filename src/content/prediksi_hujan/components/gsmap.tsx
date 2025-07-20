'use client';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  LayersControl,
  ImageOverlay,
} from 'react-leaflet';
import { LatLngBounds } from 'leaflet';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Title, Tooltip as ChartTooltip, Legend, BarElement, ChartData } from 'chart.js';
import Image from 'next/image';


ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  PointElement,
  Legend,
);

type Region = {
  name: string;
  lat: number;
  lon: number;
};


const PrevIcon = () => (
  <svg width="24" height="24" fill="none">
    <path d="M20 10l-6 6 6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const NextIcon = () => (
  <svg width="24" height="24" fill="none">
    <path d="M12 10l6 6-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const wilayahList: Region[] = [
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

 
  const rainfallDataCache = new Map<
    string,
    { labels: string[]; values: number[] }
  >();

 
async function getRainfallData(
  region: string
): Promise<{ labels: string[]; values: number[] }> {
  if (rainfallDataCache.has(region)) {
    return rainfallDataCache.get(region)!;
  }

  const apiUrl = '/api/data_series_gsmap';
  const response = await fetch(apiUrl);
  if (!response.ok) {
    return { labels: [], values: [] };
  }
  let data = await response.json();

  // 1) Urutkan ascending berdasarkan waktu
  data.sort((a: any, b: any) =>
    new Date(a.waktu_wib).getTime() - new Date(b.waktu_wib).getTime()
  );

  // 2) Map ke labels / values
  const labels = data.map((item: any) => {
    const d = new Date(item.waktu_wib);
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    return `${day}/${month} ${hh}:${mm}`;
  });
  const values = data.map((item: any) => item.curah_hujan_mm);

  const result = { labels, values };
  rainfallDataCache.set(region, result);
  return result;
}


// di scope module, di atas komponen:
const regionObsCache = new Map<
  string,
  { labels: string[]; values: number[] }
>();

async function getRegionRainfallData(
  region: string
): Promise<{ labels: string[]; values: number[] }> {
  if (regionObsCache.has(region)) {
    return regionObsCache.get(region)!;
  }

  const res = await fetch('/api/data_obs');
  if (!res.ok) return { labels: [], values: [] };
  const allData: Array<{ filename: string; data: { waktu_wib: string; ch_mm: number }[] }> = await res.json();

  // filter dan pilih file terbaru seperti sebelumnya...
  const regionFiles = allData
    .filter(item => item.filename.includes(`AWS_${region}`))
    .map(item => item.filename)
    .sort((a, b) => {
      const [dA, mA, yA] = a.match(/(\d{2})-(\d{2})-(\d{4})/)!.slice(1);
      const [dB, mB, yB] = b.match(/(\d{2})-(\d{2})-(\d{4})/)!.slice(1);
      return new Date(+yB,+mB-1,+dB).getTime() - new Date(+yA,+mA-1,+dA).getTime();
    });

  if (!regionFiles.length) return { labels: [], values: [] };
  const latestFilename = regionFiles[0];
  const obs = allData.find(item => item.filename === latestFilename)!.data;

  // **Urutkan ascending** berdasarkan waktu
  obs.sort((a, b) =>
    new Date(a.waktu_wib).getTime() - new Date(b.waktu_wib).getTime()
  );

  const labels = obs.map(d => {
    const dt = new Date(d.waktu_wib);
    const day = dt.getDate();
    const month = dt.getMonth() + 1;
    const hh = dt.getHours().toString().padStart(2, '0');
    const mm = dt.getMinutes().toString().padStart(2, '0');
    return `${day}/${month} ${hh}:${mm}`;
  });
  const values = obs.map(d => d.ch_mm);

  const result = { labels, values };
  regionObsCache.set(region, result);
  return result;
}


const getRainPredictionDataLag30 = async (url: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch rain prediction data for lag 30');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching rain prediction data for lag 30:", error);
    return [];
  }
};

const getRainPredictionDataLag60 = async (url: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch rain prediction data for lag 60');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching rain prediction data for lag 60:", error);
    return [];
  }
};

const calculateAverageProbabilities = (dataLag30: any[], dataLag60: any[]) => {
  const models = Array.from(new Set([...dataLag30.map((item) => item.model), ...dataLag60.map((item) => item.model)]));
  const averages = models.map((model) => {
    const modelDataLag30 = dataLag30.find((item) => item.model === model);
    const modelDataLag60 = dataLag60.find((item) => item.model === model);
    const avgHujan = (modelDataLag30?.hujan + modelDataLag60?.hujan) / 2;
    const avgTidakHujan = (modelDataLag30?.tidak_hujan + modelDataLag60?.tidak_hujan) / 2;
    return {
      model,
      avgHujan,
      avgTidakHujan
    };
  });
  return averages;
};

const urlLag30 = "/api/ensemble_plot_lag_30";  
const urlLag60 = "/api/ensemble_plot_lag_60";  

const PetaCBM = () => {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [geojsonDataList, setGeojsonDataList] = useState<any[]>([]);
  const [gsmapcekOverlayList, setGsmapcekOverlayList] = useState<any[]>([]);
  const [gsmapcekLegendUrl, setGsmapcekLegendUrl] = useState<string | null>(null);
  const [currentOverlayIndex, setCurrentOverlayIndex] = useState(0);
  const [currentDatetime, setCurrentDatetime] = useState<string>('');
  const [currentLegendIndex, setCurrentLegendIndex] = useState<number>(0);
  const [gsmapcekLegendList, setGsmapcekLegendList] = useState<any[]>([]);
  const [legendVisible, setLegendVisible] = useState<boolean>(true);
  const bounds = new LatLngBounds([-7.28, 107.58], [-6.92, 107.94]); // Wilayah CBM 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
 
  

  useEffect(() => {
    if (!selectedRegion) return;
    const updateChartData = async () => {
      const rainfallData       = await getRainfallData(selectedRegion);
      const regionRainfallData = await getRegionRainfallData(selectedRegion);
      const dataLag30 = await getRainPredictionDataLag30(urlLag30);
      const dataLag60 = await getRainPredictionDataLag60(urlLag60);
      const averages       = calculateAverageProbabilities(dataLag30, dataLag60);
      const models         = averages.map((item) => item.model);
      const avgHujan       = averages.map((item) => item.avgHujan);
      const avgTidakHujan  = averages.map((item) => item.avgTidakHujan);
      setChartData({
        chart1: {
          labels: rainfallData.labels,
          datasets: [
            {
              label: `CH (mm/jam) ${selectedRegion}`,
              data: rainfallData.values,
              borderColor: 'rgb(75, 192, 192)',
              tension: 0.1,
            },
          ],
        },
        chart2: {
          labels: regionRainfallData.labels,
          datasets: [
            {
              label: `Curah Hujan (mm/menit) ${selectedRegion}`,
              data: regionRainfallData.values,
              borderColor: 'rgb(255, 99, 132)',
              tension: 0.1,
            },
          ],
        },
        chart3: {
          labels: models,
          datasets: [
            {
              label: `Avg Prob Hujan ${selectedRegion}`,
              data: avgHujan,
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
              borderColor: 'rgb(75, 192, 192)',
              borderWidth: 1,
            },
            {
              label: `Avg Prob Tidak Hujan ${selectedRegion}`,
              data: avgTidakHujan,
              backgroundColor: 'rgba(255, 99, 132, 0.5)',
              borderColor: 'rgb(255, 99, 132)',
              borderWidth: 1,
            },
          ],
        },
      });
    };

    updateChartData();
  }, [selectedRegion]);


    useEffect(() => {
      const fetchData = async () => {
        try {
          setIsLoading(true);
          setError(null);
          
          const res = await fetch('/api/gsmap');
          if (!res.ok) {
            throw new Error(`API error: ${res.status}`);
          }
          
          const data = await res.json();
          
          if (!data.gsmapcek_overlay || !data.gsmapcek_legend) {
            throw new Error('Invalid data format');
          }

          const sortedOverlay = [...data.gsmapcek_overlay].sort((a, b) => 
            new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
          );
          
          const sortedLegend = [...data.gsmapcek_legend].sort((a, b) => 
            new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
          );

          setGsmapcekOverlayList(sortedOverlay);
          setGsmapcekLegendList(sortedLegend);
          setCurrentDatetime(sortedOverlay[0]?.datetime || '');
          setGsmapcekLegendUrl(sortedLegend[0]?.url || '');
        } catch (err) {
          console.error('Fetch error:', err);
          setError(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }, []);

    // Navigasi next/prev tetap menggunakan indeks terurut
  useEffect(() => {
    if (gsmapcekLegendList.length > 0 && gsmapcekOverlayList.length > 0) {
      setCurrentDatetime(gsmapcekOverlayList[currentOverlayIndex]?.datetime || '');
      
      // Gunakan URL yang sudah diproxy (tanpa alamat IP backend)
      setGsmapcekLegendUrl(gsmapcekLegendList[currentLegendIndex]?.url || '');
    }
  }, [currentOverlayIndex, currentLegendIndex, gsmapcekOverlayList, gsmapcekLegendList]);
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Map Section */}
        <div className="w-full lg:w-1/2">
          <MapContainer
            style={{ height: '700px', width: '100%' }}
            bounds={new LatLngBounds([-7.28, 107.58], [-6.92, 107.94])}
            center={[-7.05, 107.75]}
            zoom={13}
          >
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="Satellite">
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution="Tiles © Esri"
                />
                
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Light">
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png" />
              </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Dark">
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png" />
                </LayersControl.BaseLayer>
            </LayersControl>
            {wilayahList.map((region, idx) => (
              <CircleMarker
                key={idx}
                center={[region.lat, region.lon]}
                radius={11}
                color="blue"
                fillOpacity={0.7}
                eventHandlers={{
                  click: () => {
                    setSelectedRegion(region.name);
                  },
                }}
              >
                <Tooltip>{region.name}</Tooltip>
              </CircleMarker>
            ))}
            {/* Overlay GSMap */}
              <LayersControl.BaseLayer name="Legenda" checked={legendVisible} >
                {legendVisible && gsmapcekLegendUrl && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '10px',
                      zIndex: 1000,
                      width: 'auto',
                      height: '190px',
                      backgroundColor: 'white',
                      borderRadius: '5px',
                      padding: '5px',
                      boxShadow: '0px 4px 6px rgba(0,0,0,0.1)',
                      }}
                    >
                    <div className="w-[90px]">
                      <Image
                        src={gsmapcekLegendUrl}
                        alt="GS Map Legend"
                        width={90}
                        height={90}
                        style={{ objectFit: "contain", width: "100%", height: "auto" }}
                      />
                    </div>


                    </div>
                    )}
                    </LayersControl.BaseLayer>
                    {gsmapcekOverlayList.length > 0 && (
                      <ImageOverlay
                        key={currentOverlayIndex}
                        bounds={bounds}
                        url={gsmapcekOverlayList[currentOverlayIndex]?.url} 
                        opacity={0.78}
                      />
                    )}
          </MapContainer>
            {/* Navigation Control */}
            <br />
            <div className="flex justify-center mt-4">
              <div className="bg-gray-800 rounded-xl px-4 py-2 flex items-center gap-4 shadow-lg">
                <button
                  onClick={() => {
                    setCurrentOverlayIndex((prev) => (prev > 0 ? prev - 1 : gsmapcekOverlayList.length - 1));
                    setCurrentLegendIndex((prev) => (prev > 0 ? prev - 1 : gsmapcekOverlayList.length - 1));
                  }}
                  className="p-1 rounded-full hover:bg-white/10 transition"
                >
                  <PrevIcon />
                </button>
                <span className="text-white font-medium">
                  {currentDatetime || "--"} <span className="text-xs">WIB</span>
                </span>

                <button
                  onClick={() => {
                    setCurrentOverlayIndex((prev) => (prev < gsmapcekOverlayList.length - 1 ? prev + 1 : 0));
                    setCurrentLegendIndex((prev) => (prev < gsmapcekOverlayList.length - 1 ? prev + 1 : 0));
                  }}
                  className="p-1 rounded-full hover:bg-white/10 transition"
                >
                  <NextIcon />
                </button>
              </div>
            </div>
        </div>
        {/* Chart */}
        <div className="w-full lg:w-1/2">
          <div className="bg-white rounded-lg shadow-md p-4 h-full">
            <h2 className="text-xl font-bold mb-4">
              {selectedRegion ? `Curah Hujan dan Evaluasi Model Prediksi di ${selectedRegion}` : 'Pilih Wilayah'}
            </h2>

            {/* Render chart data  */}
            {chartData && chartData.chart1 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Pola Curah Hujan Harian (Data GSMap)</h3>
                  <div className="h-64">
                    <Line
                      data={chartData.chart1}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                      }}
                    />
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Pola Curah Hujan 5 Menit Harian (Data Obs) </h3>
                  <div className="h-64">
                    <Line
                      data={chartData.chart2}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p>Data sedang dimuat...</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Chart 3 (Bar Chart) */}
            {chartData && chartData.chart3 && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold mb-2">Rata-rata Akurasi Model Prediksi</h3>
                <div className="h-64">
                  <Bar
                    data={chartData.chart3}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                    }}
                  />
                </div>
              </div>
            )}
              {selectedRegion ? (
                    <>
                    <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Informasi Wilayah</h3>
                      <div className="h-64 p-4 overflow-y-auto">
                        <h4 className="font-medium text-lg">{selectedRegion}</h4>
                        <p className="mt-2 text-gray-600">
                          Data curah hujan Satelit dan observasi untuk wilayah {selectedRegion}.
                          Akurasi model berfungsi untuk menilai seberapa mungkin dalam kurung waktu
                          30 menit dan 60 menit ke depan terjadinya hujan.
                        </p>
                        <div className="mt-4 space-y-2">
                          <p><span className="font-medium">Koordinat:</span> {
                            wilayahList.find(r => r.name === selectedRegion)?.lat + ', ' + 
                            wilayahList.find(r => r.name === selectedRegion)?.lon
                          }</p>
                          <p><span className="font-medium">Update Terakhir:</span> {new Date().toLocaleDateString()} </p>
                        </div>
                      </div>
                    </div>
                    </>
                  ) : (
                    <p className="text-gray-500">Klik pada marker di peta GSMAP untuk melihat persebaran data hujan tiap wilayah</p>
                  )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetaCBM;
