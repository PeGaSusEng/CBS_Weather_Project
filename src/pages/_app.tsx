import '@/index.css';
import 'leaflet/dist/leaflet.css';   
import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import SplashScreen from '@/components/SplashScreen';
import { Roboto } from 'next/font/google';
import Head from 'next/head'; 


const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
});

export default function MyApp({ Component, pageProps }: AppProps) {
  const [loading, setLoading] = useState(true);

 
  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 2500);
    return () => clearTimeout(timeout);
  }, []);

  if (loading) return <SplashScreen />;

  return (
    <>
      <Head>
        <link rel="icon" type="image/png" href="/logos/logo.png" />
      </Head>
      <main className={roboto.className}>
        <Component {...pageProps} />
      </main>
    </>
  );
}
