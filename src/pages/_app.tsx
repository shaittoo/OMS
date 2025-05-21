import '@fortawesome/fontawesome-free/css/all.min.css';
import '../pages/globals.css'; 
import type { AppProps } from 'next/app';

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}