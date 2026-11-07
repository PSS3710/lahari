import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Lahari | Devotional Songs & Lyrics",
  description: "Listen to devotional songs with lyrics. Browse by folder and search your favourite bhajans.",
  metadataBase: new URL("https://www.lahariannapoorna.in"),
  openGraph: {
    title: "Lahari | Devotional Songs & Lyrics",
    description: "Listen to devotional songs with lyrics.",
    url: "https://www.lahariannapoorna.in",
    siteName: "Lahari",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}


