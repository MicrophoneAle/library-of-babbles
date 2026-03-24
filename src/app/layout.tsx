import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import PageTransition from "@/components/ui/PageTransition";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel"
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant"
});

export const metadata: Metadata = {
  title: "Library of Babbles",
  description: "A personal website and living library administration system."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${cinzel.variable} ${cormorant.variable} min-h-screen font-serif`}>
        <Navbar />
        <main className="min-h-[calc(100vh-57px)] w-full">
          <PageTransition>{children}</PageTransition>
        </main>
      </body>
    </html>
  );
}
