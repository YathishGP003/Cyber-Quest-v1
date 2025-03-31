import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { User } from "@/lib/types";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, User as UserIcon, Shield, Star } from "lucide-react";

interface LeaderboardUser {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  totalPoints: number;
  currentLevel: number;
  rank: number;
}

async function getLeaderboardUsers(): Promise<LeaderboardUser[]> {
  try {
    // Get all users ordered by total points
    const users = await db.user.findMany({
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        totalPoints: true,
        currentLevel: true,
      },
      orderBy: {
        totalPoints: 'desc'
      },
      take: 50 // Limit to top 50 users
    });
    
    // Add rank to each user
    return users.map((user, index) => ({
      ...user,
      rank: index + 1
    }));
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    return [];
  }
}

export default async function LeaderboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }
  
  const leaderboardUsers = await getLeaderboardUsers();
  const currentUser = leaderboardUsers.find(user => user.id === userId);
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-white/85 mt-2">
          Top cybersecurity experts ranked by total points earned
        </p>
      </div>
      
      {/* Current User Rank */}
      {currentUser && (
        <Card className="bg-black/30 border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-green-500" />
              Your Ranking
            </CardTitle>
            <CardDescription>
              Your current position on the leaderboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-green-500/20 p-3 rounded-full">
                  <UserIcon className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <div className="flex items-center">
                    <p className="font-semibold">
                      {currentUser.firstName || currentUser.username || "Anonymous User"}
                    </p>
                    {currentUser.id === userId && (
                      <Badge className="ml-2 bg-green-600">You</Badge>
                    )}
                  </div>
                  <p className="text-sm text-white/85">Level {currentUser.currentLevel}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">#{currentUser.rank}</p>
                <p className="text-sm text-white/85">{currentUser.totalPoints} points</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Leaderboard */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Global Rankings</CardTitle>
          <CardDescription>
            Top agents in our cybersecurity training program
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/50 text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Level</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {leaderboardUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    className={`${user.id === userId ? 'bg-green-900/20' : user.rank <= 3 ? 'bg-yellow-900/10' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.rank === 1 ? (
                          <Trophy className="h-5 w-5 text-yellow-500 mr-1" />
                        ) : user.rank === 2 ? (
                          <Medal className="h-5 w-5 text-gray-400 mr-1" />
                        ) : user.rank === 3 ? (
                          <Medal className="h-5 w-5 text-amber-700 mr-1" />
                        ) : (
                          <span className="font-mono text-sm text-white/85 mr-1">#{user.rank}</span>
                        )}
                        {user.rank <= 3 && (
                          <span className="font-semibold text-white">{user.rank}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-full ${user.rank === 1 ? 'bg-yellow-500/20' : user.rank === 2 ? 'bg-gray-400/20' : user.rank === 3 ? 'bg-amber-700/20' : 'bg-blue-500/20'}`}>
                          <UserIcon className={`h-4 w-4 ${user.rank === 1 ? 'text-yellow-500' : user.rank === 2 ? 'text-gray-400' : user.rank === 3 ? 'text-amber-700' : 'text-blue-500'}`} />
                        </div>
                        <div className="ml-3">
                          <div className="flex items-center">
                            <p className="font-medium text-white">
                              {user.firstName || user.username || "Anonymous User"}
                            </p>
                            {user.id === userId && (
                              <Badge className="ml-2 bg-green-600">You</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className="bg-blue-900 text-white">Level {user.currentLevel}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-white font-semibold">{user.totalPoints}</div>
                      <div className="text-xs text-white/85">points</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Trophy Icons Explanation */}
      <Card className="bg-black/30 border-yellow-500/20">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
            Ranking System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <div>
                <p className="font-medium text-white">Gold Rank (#1)</p>
                <p className="text-sm text-white/85">Top agent on the platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Medal className="h-6 w-6 text-gray-400" />
              <div>
                <p className="font-medium text-white">Silver Rank (#2)</p>
                <p className="text-sm text-white/85">Second highest points</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Medal className="h-6 w-6 text-amber-700" />
              <div>
                <p className="font-medium text-white">Bronze Rank (#3)</p>
                <p className="text-sm text-white/85">Third highest points</p>
              </div>
            </div>
          </div>
          <div className="mt-4 bg-black/20 p-4 rounded-md">
            <p className="text-sm text-white/85">
              Rankings are updated in real-time as users complete activities and earn points. Keep learning and completing challenges to climb the ranks!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 