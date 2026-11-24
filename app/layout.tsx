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
  description: "Devotional songs and stotrams sung by Mrs. Annapoorna Nagaraju, with lyrics. Roju Oka Chinthana shares timeless values of Sanatana Dharma.",
  metadataBase: new URL("https://www.lahariannapoorna.in"),
  creator: "Sai Sarvesh P",
  other: {
  "website-creator": "Sai Sarvesh",
  "website-note": "Songs written and sung by Mrs. Annapoorna Nagaraju. Website designed and created by Sai Sarvesh P.",
  },
  openGraph: {
    title: "Lahari | Devotional Songs & Lyrics",
    description: "Devotional songs and stotrams sung by Mrs. Annapoorna Nagaraju, with lyrics. Roju Oka Chinthana shares timeless values of Sanatana Dharma.",
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


