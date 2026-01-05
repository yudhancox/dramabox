import type { Metadata } from "next";
import "@/styles/globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Suspense } from "react";
import Script from "next/script";

export const metadata: Metadata = {
  title: "DramaBox - Streaming Drama Pendek",
  description: "Nonton drama pendek gratis dan tanpa iklan.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Library Adsgram */}
        <Script
          src="https://sad.adsgram.ai/js/sad.min.js"
          strategy="afterInteractive"
        />

        {/* LOGIC ADSGRAM – TANPA COMPONENT */}
        <Script
          id="adsgram-inline"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                let adController = null;
                let lastShown = 0;
                const COOLDOWN = 300000; // 5 menit
                let canShow = true;

                function initAdsgram() {
                  if (!window.Adsgram) return;
                  if (!adController) {
                    adController = window.Adsgram.init({
                      blockId: "int-20632"
                    });
                  }
                }

                function showAd() {
                  const now = Date.now();
                  if (!canShow) return;
                  if (now - lastShown < COOLDOWN) return;

                  if (!adController) initAdsgram();
                  if (!adController) return;

                  canShow = false;

                  adController.show()
                    .then(function () {
                      lastShown = now;
                      setTimeout(function () {
                        canShow = true;
                      }, COOLDOWN);
                    })
                    .catch(function () {
                      canShow = true;
                    });
                }

                function userTrigger() {
                  showAd();
                }

                ["click", "touchstart", "scroll"].forEach(function (evt) {
                  window.addEventListener(evt, userTrigger);
                });
              })();
            `,
          }}
        />
      </head>

      <body className="font-sans antialiased">
        <Providers>
          <Suspense fallback={<div className="h-16" />}>
            <Header />
          </Suspense>

          {children}

          <Footer />
          <Toaster />
          <Sonner />
        </Providers>
      </body>
    </html>
  );
}
