import type { Metadata, Viewport } from "next";
import { Baloo_2, Inter } from "next/font/google";
import "./globals.css";
import { ProfileProvider } from "@/components/ProfileContext";
import KioskShell from "@/components/KioskShell";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

// Only used by /tv's Nocturne theme — the rest of the app stays on Baloo.
const tvInter = Inter({
  variable: "--font-tv-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "George & Arthur's Play Zone",
  description: "Games, colouring and learning for George and Arthur.",
  // PWA: app/manifest.ts holds the web app manifest; these Apple-specific
  // bits make "Add to Home Screen" on iOS/Safari produce a proper app icon
  // and standalone-mode launch instead of a bookmark that opens the browser.
  appleWebApp: {
    capable: true,
    title: "Kids Kiosk",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#fdf6ec",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${baloo.variable} ${tvInter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <ServiceWorkerRegistration />
        <ProfileProvider>
          <KioskShell>{children}</KioskShell>
        </ProfileProvider>
      </body>
    </html>
  );
}
