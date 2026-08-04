import type { Metadata, Viewport } from "next";
import { Baloo_2, Inter } from "next/font/google";
import "./globals.css";
import { ProfileProvider } from "@/components/ProfileContext";
import KioskShell from "@/components/KioskShell";

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
        <ProfileProvider>
          <KioskShell>{children}</KioskShell>
        </ProfileProvider>
      </body>
    </html>
  );
}
