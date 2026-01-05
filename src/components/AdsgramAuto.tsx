"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    Adsgram: any;
  }
}

export default function AdsgramAuto() {
  const adControllerRef = useRef<any>(null);

  useEffect(() => {
    if (!window.Adsgram) return;

    adControllerRef.current = window.Adsgram.init({
      blockId: "int-20632",
    });

    const showAd = async () => {
      try {
        const result = await adControllerRef.current.show();
        console.log("Adsgram result:", result);
      } catch (err) {
        console.error("Adsgram error:", err);
      }
    };

    // Tampilkan pertama kali setelah load
    showAd();

    // Interval 5 menit (300.000 ms)
    const interval = setInterval(showAd, 300000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
