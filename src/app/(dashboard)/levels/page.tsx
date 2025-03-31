import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { Level, UserProgress } from "@/lib/types";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, ChevronRight } from "lucide-react";

interface LevelWithUserProgress extends Level {
  isCompleted: boolean;
  isUnlocked: boolean;
  progress: number;
  pointsEarned: number;
}

async function getLevelsWithProgress(userId: string): Promise<LevelWithUserProgress[]> {
  try {
    // First, get the user to get their database ID
    const user = await db.user.findUnique({
      where: {
        clerkId: userId
      },
      select: {
        id: true,
        currentLevel: true
      }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get all levels
    const levels = await db.level.findMany({
      orderBy: {
        order: 'asc'
      }
    });
    
    // Get user progress using the database user ID
    const userProgress = await db.userProgress.findMany({
      where: {
        userId: user.id
      }
    });
    
    // Combine levels with progress data
    return levels.map((level: Level) => {
      const progress = userProgress.find((p: UserProgress) => p.levelId === level.id);
      
      // A level is unlocked if:
      // 1. It's the first level (order = 1)
      // 2. The user's current level is at least this level's order
      // 3. The previous level is completed (if this level requires it)
      const isUnlocked = 
        level.order === 1 || 
        user.currentLevel >= level.order || 
        (level.requiredToAdvance === false && user.currentLevel >= level.order - 1);
      
      return {
        ...level,
        isCompleted: progress?.isCompleted || false,
        isUnlocked,
        progress: progress ? (progress.pointsEarned / level.minPointsToPass) * 100 : 0,
        pointsEarned: progress?.pointsEarned || 0
      };
    });
  } catch (error) {
    console.error('Error fetching levels with progress:', error);
    return [];
  }
}

export default async function LevelsPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }
  
  const levels = await getLevelsWithProgress(userId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Cybersecurity Skill Levels</h1>
        <p className="text-gray-400 mt-2">
          Complete all 10 levels to become a cybersecurity expert
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {levels.map((level) => (
          <Card 
            key={level.id}
            className={`border ${level.isCompleted ? 'border-green-500/50 bg-green-950/10' : 
                      level.isUnlocked ? 'border-blue-500/20 bg-black/40' : 
                      'border-gray-700/50 bg-gray-900/30'} overflow-hidden`}
          >
            <div className={`h-1.5 w-full ${
              level.isCompleted ? 'bg-green-500' : 
              level.isUnlocked ? 'bg-blue-500' : 
              'bg-gray-700'
            }`}></div>
            
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="flex items-center space-x-2">
                  <span>Level {level.order}:</span>
                  <span className="text-white font-semibold">{level.name}</span>
                </CardTitle>
                {level.isCompleted ? (
                  <Badge className="bg-green-600 hover:bg-green-700">Completed</Badge>
                ) : level.isUnlocked ? (
                  <Badge className="bg-blue-600 hover:bg-blue-700">Unlocked</Badge>
                ) : (
                  <Badge variant="outline" className="border-gray-600 text-gray-400">
                    <Lock className="h-3 w-3 mr-1" />
                    Locked
                  </Badge>
                )}
              </div>
              <CardDescription className="mt-2">
                {level.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5 text-sm">
                    <span>Progress</span>
                    <span>{Math.min(100, Math.round(level.progress))}%</span>
                  </div>
                  <Progress value={level.progress} className="h-2" />
                </div>
                
                <div className="flex justify-between text-sm text-gray-400">
                  <div>Points: {level.pointsEarned}/{level.minPointsToPass}</div>
                  <div>Min to Pass: {level.minPointsToPass}</div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter>
              {level.isUnlocked ? (
                <Link 
                  href={`/levels/${level.id}`}
                  className={`w-full py-2.5 px-4 rounded text-center ${
                    level.isCompleted 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  } font-medium text-sm`}
                >
                  {level.isCompleted ? 'Review Level' : 'Start Level'}
                  <ChevronRight className="inline-block ml-1 h-4 w-4" />
                </Link>
              ) : (
                <button
                  disabled
                  className="w-full py-2.5 px-4 rounded bg-gray-800 text-gray-400 cursor-not-allowed font-medium text-sm"
                >
                  <Lock className="inline-block mr-1 h-3.5 w-3.5" />
                  Complete previous levels
                </button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {levels.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10">
          <Shield className="h-16 w-16 text-gray-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Error Loading Levels</h2>
          <p className="text-gray-400 mb-6">We couldn't load the level data. Please try again later.</p>
        </div>
      )}
    </div>
  );
} 