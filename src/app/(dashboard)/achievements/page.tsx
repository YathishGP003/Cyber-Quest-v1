import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { Achievement, Level } from "@/lib/types";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Lock, Calendar } from "lucide-react";

interface UserAchievement {
  id: number;
  userId: string;
  achievementId: number;
  earnedAt: Date;
}

interface AchievementWithStatus extends Achievement {
  earned: boolean;
  earnedAt?: Date;
  level?: Level | null;
}

async function getAchievementsWithStatus(userId: string): Promise<AchievementWithStatus[]> {
  try {
    // Get all achievements
    const achievements = await db.achievement.findMany({
      orderBy: [
        { levelId: 'asc' },
        { id: 'asc' }
      ],
      include: {
        level: true
      }
    });
    
    // Get user achievements
    const userAchievements = await db.userAchievement.findMany({
      where: {
        userId
      }
    });
    
    // Combine and return with earned status
    return achievements.map((achievement: any) => ({
      ...achievement,
      earned: userAchievements.some((ua: UserAchievement) => ua.achievementId === achievement.id),
      earnedAt: userAchievements.find((ua: UserAchievement) => ua.achievementId === achievement.id)?.earnedAt
    }));
  } catch (error) {
    console.error('Error fetching achievements with status:', error);
    return [];
  }
}

export default async function AchievementsPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }
  
  const achievements = await getAchievementsWithStatus(userId);
  const earnedCount = achievements.filter(a => a.earned).length;
  const totalCount = achievements.length;
  const progressPercentage = (earnedCount / totalCount) * 100;
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Achievements</h1>
        <p className="text-gray-400 mt-2">
          You've earned {earnedCount} out of {totalCount} badges ({Math.round(progressPercentage)}% complete)
        </p>
      </div>
      
      {/* Achievement Categories */}
      <div className="space-y-10">
        {/* By level achievements */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
            Level Mastery
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {achievements
              .filter(achievement => achievement.levelId !== null)
              .map((achievement) => (
                <AchievementCard 
                  key={achievement.id} 
                  achievement={achievement} 
                />
              ))}
          </div>
        </div>
        
        {/* Special achievements */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-purple-500" />
            Special Achievements
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {achievements
              .filter(achievement => achievement.levelId === null)
              .map((achievement) => (
                <AchievementCard 
                  key={achievement.id} 
                  achievement={achievement} 
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AchievementCard({ achievement }: { achievement: AchievementWithStatus }) {
  const defaultImageUrl = 'https://placehold.co/100/2c8a30/FFFFFF?text=🔐';
  
  return (
    <Card className={`border ${achievement.earned ? 'border-yellow-500/50 bg-yellow-950/10' : 'border-gray-700/50 bg-gray-900/30'}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base">
            {achievement.name}
          </CardTitle>
          {achievement.earned ? (
            <Badge className="bg-yellow-600 hover:bg-yellow-700">Earned</Badge>
          ) : (
            <Badge variant="outline" className="border-gray-600 text-gray-400">
              <Lock className="h-3 w-3 mr-1" />
              Locked
            </Badge>
          )}
        </div>
        <CardDescription>
          {achievement.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center space-x-4">
          <div className={`p-2 rounded-lg ${achievement.earned ? 'bg-yellow-500/20' : 'bg-gray-800/50'}`}>
            <Trophy className={`h-8 w-8 ${achievement.earned ? 'text-yellow-500' : 'text-gray-500'}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            {achievement.level && (
              <p className="text-sm text-gray-400">Level {achievement.level.order}: {achievement.level.name}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {achievement.earned && achievement.earnedAt && (
                <span className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  Earned on {new Date(achievement.earnedAt).toLocaleDateString()}
                </span>
              )}
              {!achievement.earned && (
                <span>Points value: {achievement.pointsValue}</span>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 