import Link from "next/link";
import { Shield, Terminal, Trophy, Lock, Cpu } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();
  
  if (userId) {
    redirect("dashboard");
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      {/* Hero Section */}
      <header className="relative pt-16 pb-16 sm:pt-24 sm:pb-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        </div>
        
        <div className="relative px-6 lg:px-8">
          <div className="mx-auto max-w-2xl py-12 sm:py-20">
            <div className="text-center">
              <div className="mb-8 flex justify-center">
                <div className="relative rounded-full p-4 bg-green-500/10 ring-1 ring-green-500/30">
                  <Shield className="h-12 w-12 text-green-500" />
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                CyberQuest
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Master cybersecurity skills through interactive challenges in a gamified learning environment.
                Defend networks, defeat hackers, and earn achievements as you level up your security expertise.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link
                  href="/sign-up"
                  className="rounded-md bg-green-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                >
                  Join the Mission
                </Link>
                <Link
                  href="/sign-in"
                  className="rounded-md bg-gray-800 px-6 py-3 text-base font-semibold text-white shadow-sm ring-1 ring-green-500/20 hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="py-16 px-6 lg:px-8 border-t border-green-500/10">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-white">
            Gamified Cybersecurity Learning
          </h2>
          <p className="mt-4 text-center text-lg text-gray-400">
            From fundamentals to advanced security concepts, all in an engaging, gamified environment.
          </p>
          
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-black/30 rounded-lg p-6 border border-green-500/20">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-green-500/10 text-green-400">
                <Terminal className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-white">10 Progressive Levels</h3>
              <p className="mt-2 text-base text-gray-400">
                From security basics to advanced threat detection, work through 10 increasing difficulty levels.
              </p>
            </div>
            
            <div className="bg-black/30 rounded-lg p-6 border border-green-500/20">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-green-500/10 text-green-400">
                <Trophy className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-white">Achievements & Badges</h3>
              <p className="mt-2 text-base text-gray-400">
                Earn recognition for your skills with achievements and shareable certificates.
              </p>
            </div>
            
            <div className="bg-black/30 rounded-lg p-6 border border-green-500/20">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-green-500/10 text-green-400">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-white">Hands-on Challenges</h3>
              <p className="mt-2 text-base text-gray-400">
                Apply your knowledge with interactive labs, simulations, and real-world scenarios.
              </p>
            </div>
            
            <div className="bg-black/30 rounded-lg p-6 border border-green-500/20">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-green-500/10 text-green-400">
                <Cpu className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-white">Track Your Progress</h3>
              <p className="mt-2 text-base text-gray-400">
                Monitor your skills growth with detailed progress tracking and performance analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-6 lg:px-8 border-t border-green-500/10 bg-black/30 mt-auto">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Begin Your Cybersecurity Journey Today
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            Join thousands of security professionals learning critical skills in a fun, gamified environment.
          </p>
          <div className="mt-8 flex items-center justify-center gap-x-6">
            <Link
              href="/sign-up"
              className="rounded-md bg-green-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/70 py-8 px-6 lg:px-8 border-t border-green-500/20">
        <div className="mx-auto max-w-7xl flex flex-col items-center">
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="h-6 w-6 text-green-500" />
            <span className="text-xl font-bold text-white">CyberQuest</span>
          </div>
          <p className="text-sm text-gray-400 text-center">
            &copy; {new Date().getFullYear()} CyberQuest. All rights reserved. A gamified platform for learning cybersecurity skills.
          </p>
        </div>
      </footer>
    </div>
  );
}
