import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Maybesurya Weather — Real-Time Forecasts",
  description: "Global weather dashboard and public developer API with fast 24-hour forecasts and 7-day outlooks.",
  openGraph: {
    title: "Maybesurya Weather",
    description: "Simple, accurate weather forecasts and public developer API.",
    url: "https://weather.maybesurya.dev",
    siteName: "maybesurya.dev",
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
      className={`${inter.variable} ${plusJakarta.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0b111e] text-slate-100 selection:bg-sky-500/30 selection:text-sky-200">
        {children}
      </body>
    </html>
  );
}
