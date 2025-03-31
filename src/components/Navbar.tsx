import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Shield, Terminal, Trophy, Home, BarChart, Briefcase } from "lucide-react";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full bg-black/50 backdrop-blur-lg border-b border-green-500/20 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <Shield className="h-8 w-8 text-green-500" />
              <span className="ml-2 text-xl font-bold text-white">CyberQuest</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/dashboard" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-green-400 hover:text-green-300">
                <Home className="mr-1 h-4 w-4" />
                Dashboard
              </Link>
              <Link href="/levels" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-white hover:text-green-300">
                <Terminal className="mr-1 h-4 w-4" />
                Levels
              </Link>
              <Link href="/achievements" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-white hover:text-green-300">
                <Trophy className="mr-1 h-4 w-4" />
                Achievements
              </Link>
              <Link href="/leaderboard" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-white hover:text-green-300">
                <BarChart className="mr-1 h-4 w-4" />
                Leaderboard
              </Link>
              <Link href="/ai-dashboard" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-white hover:text-green-300">
                <Briefcase className="mr-1 h-4 w-4" />
                Career Coach
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <Link href="/profile" className="mr-4 text-white hover:text-green-300">
              <div className="flex items-center">
                <span className="hidden md:inline mr-1">Profile</span>
              </div>
            </Link>
            <div className="flex-shrink-0">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className="sm:hidden border-t border-green-500/10">
        <div className="pt-2 pb-3 space-y-1 grid grid-cols-5">
          <Link href="/dashboard" className="text-green-400 hover:text-green-300 flex flex-col items-center py-2">
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link href="/levels" className="text-white hover:text-green-300 flex flex-col items-center py-2">
            <Terminal className="h-5 w-5" />
            <span className="text-xs mt-1">Levels</span>
          </Link>
          <Link href="/achievements" className="text-white hover:text-green-300 flex flex-col items-center py-2">
            <Trophy className="h-5 w-5" />
            <span className="text-xs mt-1">Badges</span>
          </Link>
          <Link href="/leaderboard" className="text-white hover:text-green-300 flex flex-col items-center py-2">
            <BarChart className="h-5 w-5" />
            <span className="text-xs mt-1">Leaders</span>
          </Link>
          <Link href="/career-coach" className="text-white hover:text-green-300 flex flex-col items-center py-2">
            <Briefcase className="h-5 w-5" />
            <span className="text-xs mt-1">Career</span>
          </Link>
        </div>
      </div>
    </nav>
  );
} 