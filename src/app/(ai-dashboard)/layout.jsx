'use client';

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Inter } from "next/font/google";
import Link from "next/link";
import { FileText, PenTool, MessageSquare, Plus, X, Video } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

const MainLayout = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <div className={`min-h-screen flex flex-col ${inter.className}`}>
      <Navbar />
      <main className="flex-1 pt-20 pb-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
        
        {/* Floating Action Button Menu */}
        <div className="fixed bottom-6 right-6 z-50">
          {isMenuOpen && (
            <div className="flex flex-col-reverse gap-3 mb-3 items-center">
              <Link href="/resume" className="bg-green-600 hover:bg-green-700 text-white rounded-full p-3 shadow-lg flex items-center transition-all duration-200 w-12 h-12 justify-center hover:w-auto">
                <FileText className="h-5 w-5" />
                <span className="max-w-0 overflow-hidden whitespace-nowrap transition-all duration-200 group-hover:max-w-xs group-hover:ml-2 hover:max-w-xs hover:ml-2">Resume</span>
              </Link>
              
              <Link href="/ai-cover-letter" className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 shadow-lg flex items-center transition-all duration-200 w-12 h-12 justify-center hover:w-auto">
                <PenTool className="h-5 w-5" />
                <span className="max-w-0 overflow-hidden whitespace-nowrap transition-all duration-200 group-hover:max-w-xs group-hover:ml-2 hover:max-w-xs hover:ml-2">Cover Letter</span>
              </Link>
              
              <Link href="/interview" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg flex items-center transition-all duration-200 w-12 h-12 justify-center hover:w-auto">
                <MessageSquare className="h-5 w-5" />
                <span className="max-w-0 overflow-hidden whitespace-nowrap transition-all duration-200 group-hover:max-w-xs group-hover:ml-2 hover:max-w-xs hover:ml-2">Interview</span>
              </Link>
              
              <Link href="/mock-interview" className="bg-amber-600 hover:bg-amber-700 text-white rounded-full p-3 shadow-lg flex items-center transition-all duration-200 w-12 h-12 justify-center hover:w-auto">
                <Video className="h-5 w-5" />
                <span className="max-w-0 overflow-hidden whitespace-nowrap transition-all duration-200 group-hover:max-w-xs group-hover:ml-2 hover:max-w-xs hover:ml-2">Mock Interview</span>
              </Link>
            </div>
          )}
          
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg transition-all duration-200 flex items-center justify-center ${isMenuOpen ? 'rotate-45' : ''}`}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
          </button>
        </div>
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
};

export default MainLayout;
