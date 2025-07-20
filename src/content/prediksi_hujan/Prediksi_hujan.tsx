import TabelHujan from './components/tabel';
import Gsmap_area from './components/gsmap';


export default function PredictHujan() {
  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col items-center  justify-center px-4 py-8">
      {/* GSMap Area */}
      <br /><br /><br />
      <div className="w-full mb-8 z-10">
        <Gsmap_area />
      </div>

      {/* Tabel Hujan */}
      <div className="w-full max-w-5xl">
        <div className="flex items-center justify-center text-center my-4">
          Tabel Perbandingan Prakiraan Cuaca dengan Data Observasi dan Data Satelit selama 24 jam
        </div>
        <TabelHujan />
      </div>
    </div>
  );
}
