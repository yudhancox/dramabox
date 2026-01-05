"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    Adsgram: any;
  }
}

let adController: any = null;
let lastShown = 0;
const LIMIT = 300000; // 5 menit

export default function AdsgramAuto() {
  useEffect(() => {
    if (!window.Adsgram) return;

    adController = window.Adsgram.init({
      blockId: "int-20632",
    });

    const showAd = () => {
      const now = Date.now();
      if (now - lastShown < LIMIT) return;

      adController
        .show()
        .then((result: any) => {
          console.log("Adsgram selesai", result);
          lastShown = now;
        })
        .catch((err: any) => {
          console.error("Adsgram error", err);
        });
    };

    // WAJIB user interaction
    const clickHandler = () => {
      showAd();
      document.removeEventListener("click", clickHandler);
    };

    document.addEventListener("click", clickHandler);

  }, []);

  return null;
}
