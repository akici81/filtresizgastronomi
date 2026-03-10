import { useEffect, useState } from "react";

function MyApp({ Component, pageProps }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <Component {...pageProps} />;
}

export default MyApp;