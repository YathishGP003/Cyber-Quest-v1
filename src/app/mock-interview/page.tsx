"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Agent from "@/components/Agent";
import { Laptop, Shield, Bug, Lock, Bell } from "lucide-react";

export default function MockInterviewPage() {
  const router = useRouter();
  const { userId, isLoaded, isSignedIn } = useAuth();
  const [userName, setUserName] = useState("User");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState("Cybersecurity Analyst");
  const [interviewType, setInterviewType] = useState<"interview" | "generate">("interview");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate");

  useEffect(() => {
    // Check authentication
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
      return;
    }

    // In a real implementation, you would fetch the user's name from your API
    const fetchUserData = async () => {
      try {
        // Replace with your actual API call
        // const response = await fetch(`/api/users/${userId}`);
        // const data = await response.json();
        // setUserName(data.name);
        
        // For now, just use a placeholder
        setUserName("Candidate");
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setIsLoading(false);
      }
    };

    if (isSignedIn) {
      fetchUserData();
    }
  }, [isLoaded, isSignedIn, userId, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Cybersecurity Analyst":
        return <Shield className="mr-2" size={18} />;
      case "Security Engineer":
        return <Lock className="mr-2" size={18} />;
      case "Penetration Tester":
        return <Bug className="mr-2" size={18} />;
      case "Security Architect":
        return <Laptop className="mr-2" size={18} />;
      case "SOC Analyst":
        return <Bell className="mr-2" size={18} />;
      default:
        return <Shield className="mr-2" size={18} />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Mock Interview Session</h1>
      <p className="text-center mb-8 text-gray-400">
        Practice your interview skills with our AI interviewer. The AI will ask you questions and provide feedback on your responses.
      </p>
      
      <div className="bg-black/30 rounded-lg p-6 shadow-lg border border-green-500/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Interview Role</label>
            <div className="relative">
              <select 
                className="w-full p-2 pl-9 bg-black/50 border border-green-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 appearance-none"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="Cybersecurity Analyst">Cybersecurity Analyst</option>
                <option value="Security Engineer">Security Engineer</option>
                <option value="Penetration Tester">Penetration Tester</option>
                <option value="Security Architect">Security Architect</option>
                <option value="SOC Analyst">SOC Analyst</option>
              </select>
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                {getRoleIcon(selectedRole)}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Select the role you're preparing for</p>
          </div>
          
          {/* Difficulty Level */}
          <div>
            <label className="block text-sm font-medium mb-2">Difficulty Level</label>
            <div className="flex">
              <button 
                className={`flex-1 py-2 px-3 rounded-l-lg border border-green-500/30 ${difficulty === 'beginner' ? 'bg-green-600 text-white' : 'bg-black/50 text-gray-300'}`}
                onClick={() => setDifficulty('beginner')}
              >
                Beginner
              </button>
              <button 
                className={`flex-1 py-2 px-3 border-t border-b border-green-500/30 ${difficulty === 'intermediate' ? 'bg-green-600 text-white' : 'bg-black/50 text-gray-300'}`}
                onClick={() => setDifficulty('intermediate')}
              >
                Intermediate
              </button>
              <button 
                className={`flex-1 py-2 px-3 rounded-r-lg border border-green-500/30 ${difficulty === 'advanced' ? 'bg-green-600 text-white' : 'bg-black/50 text-gray-300'}`}
                onClick={() => setDifficulty('advanced')}
              >
                Advanced
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Choose interview difficulty level</p>
          </div>
        </div>
        
        <div className="border-t border-green-500/10 pt-6 mb-6">
          <div className="bg-black/20 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-green-400 mb-2 flex items-center">
              {getRoleIcon(selectedRole)}
              {selectedRole} Interview - {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Level
            </h3>
            <p className="text-sm text-gray-400">
              This interview will test your knowledge of {selectedRole.toLowerCase()} responsibilities, technical skills, and problem-solving abilities.
              You'll be asked questions appropriate for a {difficulty} level position.
            </p>
            <div className="mt-3 text-xs text-gray-500">
              <p>• Speak clearly into your microphone</p>
              <p>• The AI will listen to your responses and provide real-time feedback</p>
              <p>• You'll receive a detailed analysis after the interview</p>
            </div>
          </div>
        </div>
        
        <Agent 
          userName={userName} 
          userId={userId || ""} 
          type={interviewType}
          role={selectedRole}
          difficulty={difficulty}
        />
      </div>
    </div>
  );
} 