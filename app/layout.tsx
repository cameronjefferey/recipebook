import type { Metadata, Viewport } from "next";
import { Homemade_Apple, Special_Elite } from "next/font/google";
import { ServiceWorker } from "@/components/service-worker";
import "./globals.css";

// One person's hand for titles and margin notes. Rough on purpose.
// See BRAND.md §5.
const hand = Homemade_Apple({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-hand-face",
  display: "swap",
});

// Body copy set like a card that was typed, not a website's default sans.
const typed = Special_Elite({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-typed",
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
  themeColor: "#f3e4cf",
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
      className={`${hand.variable} ${typed.variable}`}
    >
      <body className="min-h-dvh">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
