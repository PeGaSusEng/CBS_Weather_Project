'use client';
import dynamic from 'next/dynamic';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Head from "next/head";


const DeteksiAwanDynamic = dynamic(
  () => import("../content/deteksi_awan/Deteksi_awan"),
  { 
    ssr: false, 
    loading: () => (
      <div className="flex-grow flex items-center justify-center bg-gray-950">
        <div className="text-white text-lg">Memuat peta deteksi awan...</div>
      </div>
    )
  }
);

export default function Page_Deteksi_awan() {
  return (
    <>
      <Head>
        <title>CBS-Deteksi Awan</title>
        <meta name="description" content="Sistem Prediksi Cuaca Cekungan Bandung dan Sekitarnya" />
      </Head>
      <div className="min-h-screen flex flex-col overflow-x-hidden overflow-y-hidden bg-gray-950">
        <Navbar />
        <main className="flex-grow flex flex-col">
          <DeteksiAwanDynamic />
        </main>
        <Footer />
      </div>
    </>
  );
}