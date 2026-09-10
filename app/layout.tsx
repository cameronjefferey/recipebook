import type { Metadata, Viewport } from "next";
import { Fraunces, Nunito_Sans, Caveat } from "next/font/google";
import { ServiceWorker } from "@/components/service-worker";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});

const nunito = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Pink Recipe Box",
  description: "Every recipe worth keeping.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Recipe Box",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#c2566f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${nunito.variable} ${caveat.variable}`}
    >
      <body className="min-h-dvh">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
