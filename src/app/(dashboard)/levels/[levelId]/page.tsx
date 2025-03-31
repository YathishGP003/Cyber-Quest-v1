import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { Activity, Level, ActivityType } from "@/lib/types";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, Terminal, FileText, Code, Database, PlayCircle, CheckCircle, Lock } from "lucide-react";

interface ActivityWithProgress extends Activity {
  isCompleted: boolean;
  isUnlocked: boolean;
  pointsEarned: number;
  attempts: number;
}

interface LevelWithActivities extends Level {
  activities: ActivityWithProgress[];
  isCompleted: boolean;
  activitiesCompleted: number;
  pointsEarned: number;
  totalActivities: number;
  requiredActivities: number;
}

// Helper function to get activity icon based on type
function getActivityIcon(type: ActivityType) {
  switch(type) {
    case 'QUIZ':
      return <FileText className="h-5 w-5" />;
    case 'CODE_CHALLENGE':
      return <Code className="h-5 w-5" />;
    case 'LAB':
      return <Terminal className="h-5 w-5" />;
    case 'SIMULATION':
      return <PlayCircle className="h-5 w-5" />;
    case 'READING':
      return <Database className="h-5 w-5" />;
    default:
      return <Terminal className="h-5 w-5" />;
  }
}

async function getLevelWithActivities(levelId: string, userId: string): Promise<LevelWithActivities | null> {
  try {
    // First, ensure the user exists in our database
    const user = await db.user.findUnique({
      where: { clerkId: userId }
    });
    
    if (!user) {
      console.error(`User with clerkId ${userId} not found in database`);
      return null;
    }
    
    // Get level data with activities
    const level = await db.level.findUnique({
      where: {
        id: parseInt(levelId)
      },
      include: {
        activities: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    });
    
    if (!level) {
      return null;
    }
    
    // Get user progress for this level
    const userProgress = await db.userProgress.findUnique({
      where: {
        userId_levelId: {
          userId: user.id,
          levelId: level.id
        }
      }
    });
    
    // Get required activities for this level
    const requiredActivitiesList = level.activities.filter((a: Activity) => a.isRequired);
    const requiredActivitiesCount = requiredActivitiesList.length;
    
    // Get user's progress on all activities in this level
    const activityProgress = await db.activityProgress.findMany({
      where: {
        userId: user.id,
        activity: {
          levelId: level.id
        }
      }
    });
    
    // Add progress info to activities
    const activitiesWithProgress = level.activities.map((activity: Activity) => {
      const progress = activityProgress.find((p: any) => p.activityId === activity.id);
      
      // An activity is unlocked if:
      // 1. It's the first activity (order = 1)
      // 2. All required activities that come before it are completed
      let isUnlocked = activity.order === 1;
      
      if (!isUnlocked && activity.order > 1) {
        const previousRequiredActivities = level.activities
          .filter((a: Activity) => a.isRequired && a.order < activity.order);
        
        const allPreviousRequiredCompleted = previousRequiredActivities.length === 0 || 
          previousRequiredActivities.every((a: Activity) => {
            const prevProgress = activityProgress.find((p: any) => p.activityId === a.id);
            return prevProgress?.isCompleted || false;
          });
        
        isUnlocked = allPreviousRequiredCompleted;
      }
      
      return {
        ...activity,
        isCompleted: progress?.isCompleted || false,
        isUnlocked,
        pointsEarned: progress?.pointsEarned || 0,
        attempts: progress?.attempts || 0
      };
    });
    
    return {
      ...level,
      activities: activitiesWithProgress,
      isCompleted: userProgress?.isCompleted || false,
      activitiesCompleted: userProgress?.activitiesCompleted || 0,
      pointsEarned: userProgress?.pointsEarned || 0,
      totalActivities: level.activities.length,
      requiredActivities: requiredActivitiesCount
    };
  } catch (error) {
    console.error('Error fetching level with activities:', error);
    return null;
  }
}

export default async function LevelDetailPage({ params }: { params: { levelId: string } }) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }
  
  // Get user data
  const levelData = await getLevelWithActivities(params.levelId, userId);
  
  if (!levelData) {
    return <div>Level not found or error fetching level data</div>;
  }
  
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <Link href="/levels" className="text-white/85 hover:text-white flex items-center">
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back to Levels
        </Link>
      </div>
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Level {levelData.order}: {levelData.name}
          {levelData.isCompleted && (
            <Badge className="ml-3 bg-green-600">Completed</Badge>
          )}
        </h1>
        <p className="text-white/85 mt-2 max-w-3xl">
          {levelData.description}
        </p>
      </div>
      
      {/* Progress Overview */}
      <Card className="bg-black/30 border-green-500/20">
        <CardHeader>
          <CardTitle>Level Progress</CardTitle>
          <CardDescription>
            Complete activities to earn points and unlock the next level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5 text-sm">
                <span>Level completion</span>
                <span>
                  {levelData.pointsEarned}/{levelData.minPointsToPass} points to pass 
                  ({Math.min(100, Math.round((levelData.pointsEarned / levelData.minPointsToPass) * 100))}%)
                </span>
              </div>
              <Progress 
                value={Math.min(100, (levelData.pointsEarned / levelData.minPointsToPass) * 100)} 
                className="h-2"
              />
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm text-white/85">
              <div>Completed: {levelData.activitiesCompleted}/{levelData.totalActivities} activities</div>
              <div>Required: {levelData.requiredActivities} activities</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Activities */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-white">Level Activities</h2>
        
        <div className="space-y-4">
          {levelData.activities.map((activity) => (
            <Card 
              key={activity.id}
              className={`border ${
                activity.isCompleted 
                  ? 'border-green-500/50 bg-green-950/10' 
                  : activity.isUnlocked 
                    ? 'border-blue-500/20 bg-black/40' 
                    : 'border-gray-700/50 bg-gray-900/30'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="flex items-center text-lg">
                    <div className={`p-1.5 rounded-md mr-3 ${
                      activity.isCompleted 
                        ? 'bg-green-500/20 text-green-500' 
                        : activity.isUnlocked 
                          ? 'bg-blue-500/20 text-blue-500' 
                          : 'bg-gray-800 text-gray-500'
                    }`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    {activity.name}
                  </CardTitle>
                  
                  <div className="flex space-x-2">
                    {activity.isRequired && (
                      <Badge variant="outline" className="border-yellow-500/30 text-yellow-500">
                        Required
                      </Badge>
                    )}
                    
                    {activity.isCompleted ? (
                      <Badge className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    ) : activity.isUnlocked ? (
                      <Badge className="bg-blue-600">Unlocked</Badge>
                    ) : (
                      <Badge variant="outline" className="border-gray-600 text-white">
                        <Lock className="h-3 w-3 mr-1" />
                        Locked
                      </Badge>
                    )}
                  </div>
                </div>
                
                <CardDescription>{activity.description}</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="flex justify-between text-sm text-white/85">
                  <div>Type: {activity.type.replace('_', ' ')}</div>
                  <div>Points: {activity.points}</div>
                  {activity.attempts > 0 && (
                    <div>Attempts: {activity.attempts}</div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter>
                {activity.isUnlocked ? (
                  <Link 
                    href={`/levels/${levelData.id}/activities/${activity.id}`}
                    className={`w-full py-2.5 px-4 rounded text-center ${
                      activity.isCompleted 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    } font-medium text-sm`}
                  >
                    {activity.isCompleted ? 'Review Activity' : 'Start Activity'}
                  </Link>
                ) : (
                  <button
                    disabled
                    className="w-full py-2.5 px-4 rounded bg-gray-800 text-white cursor-not-allowed font-medium text-sm"
                  >
                    <Lock className="inline-block mr-1 h-3.5 w-3.5" />
                    Complete required activities first
                  </button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
      
      {/* If no activities */}
      {levelData.activities.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Terminal className="h-16 w-16 text-gray-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">No Activities Found</h2>
          <p className="text-white/85 mb-6">This level doesn't have any activities yet.</p>
        </div>
      )}
    </div>
  );
} 