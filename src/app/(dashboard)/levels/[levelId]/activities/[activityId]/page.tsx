import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import QuizActivity from "@/components/activities/QuizActivity";
import LabActivity from "@/components/activities/LabActivity";
import ReadingActivity from "@/components/activities/ReadingActivity";

export default async function ActivityPage({ params }: { 
  params: { levelId: string; activityId: string } 
}) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }
  
  // Get user data
  const user = await db.user.findUnique({
    where: { clerkId: userId }
  });
  
  if (!user) {
    redirect("/sign-in");
  }
  
  // Get activity data
  const activity = await db.activity.findUnique({
    where: {
      id: parseInt(params.activityId)
    }
  });
  
  if (!activity) {
    redirect(`/levels/${params.levelId}`);
  }
  
  // Get level data
  const level = await db.level.findUnique({
    where: {
      id: parseInt(params.levelId)
    }
  });
  
  if (!level) {
    redirect("/levels");
  }
  
  // Get activity progress
  const activityProgress = await db.activityProgress.findUnique({
    where: {
      userId_activityId: {
        userId: user.id,
        activityId: parseInt(params.activityId)
      }
    }
  });
  
  // Check if activity is unlocked
  // For simplicity, we'll consider it unlocked if it exists in this level
  const isUnlocked = activity.levelId === parseInt(params.levelId);
  
  if (!isUnlocked) {
    redirect(`/levels/${params.levelId}`);
  }
  
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link 
          href={`/levels/${params.levelId}`}
          className="inline-flex items-center text-sm text-blue-500 hover:text-blue-600"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Level
        </Link>
        <h1 className="text-3xl font-bold mt-4">{activity.name}</h1>
      </div>
      
      <Card className="mb-8 p-6 bg-gray-800/30">
        {/* Activity component based on type */}
        {activity.type === "QUIZ" && (
          <QuizActivity 
            activity={activity} 
            userId={user.id} 
            progress={activityProgress}
          />
        )}
        
        {activity.type === "LAB" && (
          <LabActivity 
            activity={activity} 
            userId={user.id}
            progress={activityProgress}
          />
        )}
        
        {activity.type === "READING" && (
          <ReadingActivity 
            activity={activity} 
            userId={user.id}
            progress={activityProgress}
          />
        )}
        
        {/* Default message if unknown activity type */}
        {!["QUIZ", "LAB", "READING"].includes(activity.type) && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Activity Type Not Supported</h2>
            <p className="text-gray-400 mb-6">This activity type is not currently supported in the platform.</p>
            <Button asChild>
              <Link href={`/levels/${params.levelId}`}>
                Return to Level
              </Link>
            </Button>
          </div>
        )}
      </Card>
      
      <div className="text-right mt-4">
        <Button asChild>
          <Link href={`/levels/${params.levelId}`}>
            Return to Level
          </Link>
        </Button>
      </div>
    </div>
  );
} 