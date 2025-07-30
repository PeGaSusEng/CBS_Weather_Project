import TabelHujan from './components/tabel';
import Gsmap_area from './components/gsmap';

export default function PredictHujan() {
  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-8 space-y-8">

      <br></br>
      <div className="w-full mb-4 z-10">
        <Gsmap_area />
      </div>

 
      <div className="w-full max-w-5xl">
        <h2 className="text-2xl font-bold text-blue-700 mb-4 text-center">
          Klasifikasi Curah Hujan <span className="text-yellow-500">BMKG</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <div className="text-4xl mb-2">🌦️</div>
            <h3 className="font-semibold mb-1">0 - 20 mm</h3>
            <p className="text-sm text-gray-600 text-center">Hujan Ringan</p>
          </div>
          <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <div className="text-4xl mb-2">🌧️</div>
            <h3 className="font-semibold mb-1">21 - 50 mm</h3>
            <p className="text-sm text-gray-600 text-center">Hujan Sedang</p>
          </div>
          <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <div className="text-4xl mb-2">⛈️</div>
            <h3 className="font-semibold mb-1">51 - 100 mm</h3>
            <p className="text-sm text-gray-600 text-center">Hujan Lebat</p>
          </div>
          <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <div className="text-4xl mb-2">🌩️</div>
            <h3 className="font-semibold mb-1">&gt; 100 mm</h3>
            <p className="text-sm text-gray-600 text-center">Hujan Sangat Lebat</p>
          </div>
        </div>
      </div>


      <div className="w-full max-w-5xl">
        <h2 className="text-xl font-medium text-gray-700 mb-3 text-center">
          Tabel Perbandingan Prakiraan Cuaca dengan Data Observasi dan Data Satelit selama 24 jam
        </h2>
        <TabelHujan />
      </div>
    </div>
  );
}
