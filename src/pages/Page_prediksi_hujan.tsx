'use client';
import dynamic from 'next/dynamic';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Head from "next/head";

// Dynamic import untuk komponen Prediksi_Hujan dengan disabled SSR
const PrediksiHujanContent = dynamic(
  () => import("../content/prediksi_hujan/Prediksi_hujan"),
  { 
    ssr: false, // Nonaktifkan SSR untuk komponen ini
    loading: () => (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-lg">Memuat peta prediksi hujan...</div>
      </div>
    )
  }
);

export default function Page_Prediksi_hujan() {
  return (
    <>
      <Head>
        <title>CBS-Prediksi Hujan</title>
        <meta name="description" content="Sistem Prediksi Cuaca Cekungan Bandung dan Sekitarnya" />
      </Head>
      <div className="min-h-screen flex flex-col overflow-x-hidden overflow-y-hidden bg-white z-[1000]">
        <Navbar />
        <main className="flex-grow">
          <PrediksiHujanContent />
        </main>
        <Footer />
      </div>
    </>
  );
}