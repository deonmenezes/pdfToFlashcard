"use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "./components/Navigation/page";
import Footer from "./components/Footer/page";
import { useState } from "react";

const inter = Inter({ subsets: ["latin"] });


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <html lang="en">
      <body className={inter.className}>
        <Navigation isDarkMode={false} toggleTheme={function (): void {
          throw new Error("Function not implemented.");
        } } />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
