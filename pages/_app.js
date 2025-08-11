// pages/_app.js

import '../styles/index.css'; // ✅ Adjust this path if your CSS file is elsewhere

export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
