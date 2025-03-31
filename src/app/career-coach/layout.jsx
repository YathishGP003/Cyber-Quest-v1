'use client';

import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Navbar } from "@/components/Navbar";
import CareerCoachButtons from "@/components/CareerCoachButtons";

const inter = Inter({ subsets: ["latin"] });

export default function CareerCoachLayout({ children }) {
  return (
    <div className={`min-h-screen flex flex-col ${inter.className}`}>
      <Navbar />
      <main className="flex-1 pt-20 pb-10">
        {children}
        <Toaster position="top-center" richColors />
        <CareerCoachButtons />
      </main>
      <footer className="bg-black/50 backdrop-blur-sm py-4 border-t border-green-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} CyberQuest. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
} 