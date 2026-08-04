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
      <head>
        <script dangerouslySetInnerHTML={{__html: "if(localStorage.getItem('theme')==='dark'||(!localStorage.getItem('theme')&&window.matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')"}} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#003527" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script dangerouslySetInnerHTML={{__html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js')})}`}} />
      </head>
      <body className={`${inter.variable} ${sourceSerif.variable} ${jetbrainsMono.variable} font-sohne antialiased`}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-forest focus:text-white focus:px-4 focus:py-2 focus:rounded-buttons focus:text-sm focus:font-medium">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
