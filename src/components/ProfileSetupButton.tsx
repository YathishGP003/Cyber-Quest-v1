"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfileSetupButton() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<null | 'success' | 'error'>(null);
  const [message, setMessage] = useState("");

  const createUserProfile = async () => {
    if (!user) return;
    setIsLoading(true);
    setStatus(null);
    setMessage("");
    
    try {
      const response = await fetch("/api/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.primaryEmailAddress?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          clerkId: user.id,
          currentLevel: 1,
          totalPoints: 0
        }),
      });

      const data = await response.json();
      console.log("User created:", data);
      
      if (response.ok) {
        setStatus('success');
        setMessage("Profile created successfully! Redirecting to dashboard...");
        // Use hard navigation with a longer delay to ensure server-side data is refreshed
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 2000);
      } else {
        setStatus('error');
        setMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch (error) {
      setStatus('error');
      setMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded) return null;

  return (
    <div className="flex flex-col items-center space-y-2">
      <Button 
        onClick={createUserProfile} 
        disabled={isLoading || status === 'success'}
        className="bg-green-600 hover:bg-green-700 text-white font-medium"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Setting up profile...
          </>
        ) : status === 'success' ? (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Profile Created
          </>
        ) : (
          "Setup My Profile"
        )}
      </Button>
      
      {status && (
        <div className={`text-sm flex items-center ${status === 'success' ? 'text-green-500' : 'text-red-500'}`}>
          {status === 'success' ? (
            <CheckCircle className="mr-1 h-4 w-4" />
          ) : (
            <AlertCircle className="mr-1 h-4 w-4" />
          )}
          {message}
        </div>
      )}
    </div>
  );
} 