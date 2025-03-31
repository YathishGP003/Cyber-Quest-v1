import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Shield, Terminal, Trophy, Clock, ChevronRight } from "lucide-react";
import { UserProgress, UserAchievement, Achievement, Level } from "@/lib/types";
import ProfileSetupButton from "@/components/ProfileSetupButton";
import FixProgressButton from "@/components/FixProgressButton";

interface UserProgressWithLevel extends UserProgress {
  level: Level;
}

interface UserAchievementWithDetails extends UserAchievement {
  achievement: Achievement;
}

interface UserWithFullDetails {
  id: string;
  email: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  currentLevel: number;
  totalPoints: number;
  progress: UserProgressWithLevel[];
  achievements: UserAchievementWithDetails[];
}

async function getUserData(userId: string) {
  try {
    const user = await db.user.findUnique({
      where: {
        clerkId: userId
      },
      include: {
        progress: {
          include: {
            level: true
          },
          orderBy: {
            level: {
              order: 'asc'
            }
          }
        },
        achievements: {
          include: {
            achievement: true
          },
          orderBy: {
            earnedAt: 'desc'
          },
          take: 3
        }
      }
    });
    
    return user as UserWithFullDetails | null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

export default async function DashboardPage() {
  const { userId } = await auth();
 
  
  if (!userId) {
    redirect("/sign-in");
  }
  
  const userData = await getUserData(userId);
  
  if (!userData) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Shield className="h-16 w-16 text-green-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Profile Setup Required</h1>
        <p className="text-white/85 mb-6">Welcome to the Cybersecurity Platform! Click the button below to create your profile.</p>
        <ProfileSetupButton />
      </div>
    );
  }

  const currentLevel = userData.progress.find((p: UserProgressWithLevel) => p.levelId === userData.currentLevel);
  const nextLevel = userData.progress.find((p: UserProgressWithLevel) => p.levelId === userData.currentLevel + 1);
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {userData.firstName || "Agent"}</h1>
        <div className="flex items-center space-x-3">
          <FixProgressButton />
          <Link href="/profile" className="text-green-400 hover:text-green-300 flex items-center">
            View Profile <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-black/30 border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white">Current Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{userData.currentLevel}</div>
            <p className="text-xs text-white/85 mt-1">
              {currentLevel?.level.name || "Security Fundamentals"}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-black/30 border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{userData.totalPoints}</div>
            <p className="text-xs text-white/85 mt-1">
              {nextLevel ? `${nextLevel.level.minPointsToPass - userData.totalPoints} to level up` : "Max level reached!"}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-black/30 border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white">Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {userData.achievements.length}
            </div>
            <p className="text-xs text-white/85 mt-1">
              Badges earned
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-black/30 border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white">Level Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-green-500">
              <Progress value={currentLevel ? (currentLevel.pointsEarned / currentLevel.level.minPointsToPass) * 100 : 0} className="h-2" />
              <span className="text-sm font-medium">
                {currentLevel ? Math.floor((currentLevel.pointsEarned / currentLevel.level.minPointsToPass) * 100) : 0}%
              </span>
            </div>
            <p className="text-xs text-white/85 mt-2">
              {currentLevel?.isCompleted ? "Level completed!" : `${currentLevel?.activitiesCompleted || 0} activities completed`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-4 md:grid-cols-7">
        {/* Current Level */}
        <Card className="md:col-span-4 bg-black/30 border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Terminal className="mr-2 h-5 w-5 text-green-500" />
              Current Mission: Level {userData.currentLevel}
            </CardTitle>
            <CardDescription>
              {currentLevel?.level.description || "Master the fundamentals of cybersecurity."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-white/85">
                    {currentLevel ? `${currentLevel.pointsEarned}/${currentLevel.level.minPointsToPass} points` : "0/0 points"}
                  </span>
                </div>
                <Progress value={currentLevel ? (currentLevel.pointsEarned / currentLevel.level.minPointsToPass) * 100 : 0} className="h-2" />
              </div>
              
              <div className="pt-2">
                <div className="border-t border-green-500/20 pt-4">
                  <p className="text-sm">
                    Continue your training to unlock advanced techniques and become a cybersecurity expert.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Link href={`/levels/${userData.currentLevel}`} 
                  className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium text-sm rounded flex items-center justify-center">
              Continue Training <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </CardFooter>
        </Card>

        {/* Recent Achievements */}
        <Card className="md:col-span-3 bg-black/30 border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Trophy className="mr-2 h-5 w-5 text-green-500" />
              Recent Achievements
            </CardTitle>
            <CardDescription>Your latest cybersecurity accomplishments</CardDescription>
          </CardHeader>
          <CardContent>
            {userData.achievements.length > 0 ? (
              <div className="space-y-4">
                {userData.achievements.map((achievement) => (
                  <div key={achievement.id} className="flex items-start space-x-4">
                    <div className="bg-green-500/20 p-2 rounded-full">
                      <Trophy className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{achievement.achievement.name}</p>
                      <p className="text-xs text-white/85">{achievement.achievement.description}</p>
                      <p className="text-xs flex items-center text-white/85">
                        <Clock className="mr-1 h-3 w-3" />
                        {new Date(achievement.earnedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Trophy className="h-10 w-10 text-gray-500 mb-2" />
                <p className="text-sm text-white/85">Complete activities to earn your first achievements!</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Link href="/achievements" className="w-full py-2 px-4 bg-black/30 border border-green-500/30 hover:bg-black/50 text-green-400 font-medium text-sm rounded flex items-center justify-center">
              View All Achievements <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 