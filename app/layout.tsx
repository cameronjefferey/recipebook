import type { Metadata, Viewport } from "next";
import { Caveat, Source_Serif_4 } from "next/font/google";
import { ServiceWorker } from "@/components/service-worker";
import "./globals.css";

// One hand for every title and margin note — Mom's, consistently, rather
// than a font sampler of "handwriting" faces. See BRAND.md §5.
const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

// Body copy: plain and readable, closer to a typed card than a website's
// default geometric sans.
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  axes: ["opsz"],
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
      className={`${caveat.variable} ${sourceSerif.variable}`}
    >
      <body className="min-h-dvh">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
