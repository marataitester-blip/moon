import React from 'react';
import type { Metadata } from "next";
import { Inter, Cinzel } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  display: "swap" 
});

const cinzel = Cinzel({ 
  subsets: ["latin"], 
  variable: "--font-cinzel",
  display: "swap" 
});

export const metadata: Metadata = {
  title: "LUNA",
  description: "Aura Heritage Messenger",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${cinzel.variable}`}>
      <body className="bg-void text-gold antialiased min-h-screen selection:bg-gold/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}