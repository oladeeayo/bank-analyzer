import type { Metadata } from "next";
import { Inter, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sohne" });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], variable: "--font-signifier", weight: "400" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: "500" });

export const metadata: Metadata = {
  title: "CONYEST — Financial Intelligence",
  description: "Nigerian Financial Intelligence System — Upload bank statements, track spending, and gain financial insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${sourceSerif.variable} ${jetbrainsMono.variable} font-sohne antialiased`}>
        {children}
      </body>
    </html>
  );
}
