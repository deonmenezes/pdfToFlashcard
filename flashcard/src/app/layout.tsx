// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "./components/Navigation/page";
import Footer from "./components/Footer/page";
import AuthProviderWrapper from "./components/AuthProviderWrapper/AuthProviderWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "My Next.js App",
  icons: {
    icon: "/quizitt-favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProviderWrapper>
          <Navigation />
          <main>{children}</main>
          <Footer />
        </AuthProviderWrapper>
      </body>
    </html>
  );
}