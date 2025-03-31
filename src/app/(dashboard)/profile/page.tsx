import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Shield, Trophy, Award, Clock, Terminal, BookOpen, Code, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { ActivityType } from "@/lib/types";

// Get the activity type icon
function getActivityTypeIcon(type: ActivityType) {
  switch (type) {
    case "QUIZ":
      return <CheckCircle2 className="h-4 w-4 text-orange-500" />;
    case "LAB":
      return <Terminal className="h-4 w-4 text-blue-500" />;
    case "CODE_CHALLENGE":
      return <Code className="h-4 w-4 text-purple-500" />;
    case "READING":
      return <BookOpen className="h-4 w-4 text-green-500" />;
    case "SIMULATION":
      return <Shield className="h-4 w-4 text-red-500" />;
    default:
      return <CheckCircle2 className="h-4 w-4 text-gray-500" />;
  }
}

// Get user's full data including progress, achievements, and certificates
async function getUserData(userId: string) {
  try {
    const user = await db.user.findUnique({
      where: {
        clerkId: userId
      },
      include: {
        progress: {
          include: {
            level: true,
            activityProgress: {
              include: {
                activity: true
              },
              orderBy: {
                completedAt: 'desc'
              }
            }
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
          }
        },
        certificates: {
          orderBy: {
            issueDate: 'desc'
          }
        }
      }
    });
    
    return user;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

export default async function ProfilePage() {
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
        <p className="text-white/85 mb-6">We couldn't find your profile. Please go to the dashboard to set up your profile.</p>
        <Link 
          href="/dashboard"
          className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium text-sm rounded"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  // Calculate some statistics
  const totalActivitiesCompleted = userData.progress.reduce(
    (total, level) => total + level.activitiesCompleted, 0
  );
  
  const totalLevelsCompleted = userData.progress.filter(p => p.isCompleted).length;
  
  // Get the current level data
  const currentLevelProgress = userData.progress.find(p => p.level.order === userData.currentLevel);
  
  // Get recently completed activities
  const recentActivities = userData.progress
    .flatMap(p => p.activityProgress)
    .filter(ap => ap.isCompleted)
    .sort((a, b) => 
      new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime()
    )
    .slice(0, 5);
  
  // Format a date nicely
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Your Profile</h1>

      {/* User Profile Card */}
      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-3 bg-black/30 border-green-500/20">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-green-500/50">
                <AvatarFallback className="bg-green-900/30 text-lg">
                  {userData.firstName ? userData.firstName[0] : userData.email[0]}
                  {userData.lastName ? userData.lastName[0] : ''}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">
                  {userData.firstName} {userData.lastName}
                </CardTitle>
                <CardDescription>
                  {userData.username || userData.email}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Security Level</h3>
              <div className="flex items-center">
                <div className="bg-black/50 border border-green-500/30 rounded-lg px-3 py-1 inline-flex items-center">
                  <Shield className="h-4 w-4 text-green-500 mr-2" />
                  <span className="font-medium text-white">Level {userData.currentLevel}</span>
                </div>
                <span className="ml-3 text-sm text-white/70">
                  {currentLevelProgress?.level.name || "Security Fundamentals"}
                </span>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Points Earned</h3>
              <div className="flex items-center">
                <div className="bg-black/50 border border-green-500/30 rounded-lg px-3 py-1 inline-flex items-center">
                  <Trophy className="h-4 w-4 text-green-500 mr-2" />
                  <span className="font-medium text-white">{userData.totalPoints} Points</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Account Created</h3>
              <div className="text-sm text-white/70">
                {formatDate(userData.createdAt)}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Stats Grid */}
        <Card className="md:col-span-4 bg-black/30 border-green-500/20">
          <CardHeader>
            <CardTitle>Stats Overview</CardTitle>
            <CardDescription>Your cybersecurity training progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Activities Completed</h3>
                <div className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-2xl font-bold">{totalActivitiesCompleted}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Achievements Earned</h3>
                <div className="flex items-center">
                  <Trophy className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-2xl font-bold">{userData.achievements.length}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Levels Completed</h3>
                <div className="flex items-center">
                  <Terminal className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-2xl font-bold">{totalLevelsCompleted}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Certificates Earned</h3>
                <div className="flex items-center">
                  <Award className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-2xl font-bold">{userData.certificates.length}</span>
                </div>
              </div>
            </div>
            
            {currentLevelProgress && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Current Level Progress</h3>
                  <span className="text-xs text-white/70">
                    {currentLevelProgress.pointsEarned}/{currentLevelProgress.level.minPointsToPass} points
                  </span>
                </div>
                <Progress 
                  value={(currentLevelProgress.pointsEarned / currentLevelProgress.level.minPointsToPass) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-white/70 mt-2">
                  {currentLevelProgress.isCompleted 
                    ? "Level completed! Continue to next level." 
                    : `${currentLevelProgress.activitiesCompleted} activities completed in this level`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs for different sections */}
      <Tabs defaultValue="progress" className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
        </TabsList>
        
        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-6">
          <Card className="bg-black/30 border-green-500/20">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Terminal className="mr-2 h-5 w-5 text-green-500" />
                Level Progress
              </CardTitle>
              <CardDescription>Your progress through each security level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {userData.progress.map((progress) => (
                  <div key={progress.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Shield className="h-5 w-5 text-green-500 mr-2" />
                        <h3 className="font-medium">
                          Level {progress.level.order}: {progress.level.name}
                        </h3>
                        {progress.isCompleted && (
                          <Badge className="ml-2 bg-green-600">Completed</Badge>
                        )}
                      </div>
                      <span className="text-sm text-white/70">
                        {progress.pointsEarned}/{progress.level.minPointsToPass} points
                      </span>
                    </div>
                    
                    <Progress 
                      value={(progress.pointsEarned / progress.level.minPointsToPass) * 100} 
                      className="h-2"
                    />
                    
                    <div className="text-sm text-white/70 flex justify-between">
                      <span>{progress.activitiesCompleted} activities completed</span>
                      {progress.completedAt && (
                        <span className="flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          Completed on {formatDate(progress.completedAt)}
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {progress.activityProgress
                        .filter(ap => ap.isCompleted)
                        .map(ap => (
                          <div key={ap.id} className="flex items-center text-sm">
                            {getActivityTypeIcon(ap.activity.type as ActivityType)}
                            <span className="ml-2 truncate">{ap.activity.name}</span>
                            <span className="ml-auto text-white/70">{ap.pointsEarned} pts</span>
                          </div>
                        ))}
                    </div>
                    
                    {progress.level.order < userData.progress.length && (
                      <Separator className="my-4 bg-green-500/20" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Link 
                href="/levels" 
                className="w-full py-2 px-4 bg-black/30 border border-green-500/30 hover:bg-black/50 text-green-400 font-medium text-sm rounded text-center"
              >
                Go to Levels
              </Link>
            </CardFooter>
          </Card>
          
          <Card className="bg-black/30 border-green-500/20">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest completed activities</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4">
                      <div className="bg-black/50 border border-green-500/30 p-2 rounded-full">
                        {getActivityTypeIcon(activity.activity.type as ActivityType)}
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{activity.activity.name}</p>
                          <Badge className="ml-2 bg-green-600/80">{activity.pointsEarned} points</Badge>
                        </div>
                        <p className="text-sm text-white/70">{activity.activity.description}</p>
                        <p className="text-xs flex items-center text-white/70">
                          <Clock className="mr-1 h-3 w-3" />
                          Completed on {formatDate(activity.completedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle2 className="h-10 w-10 text-gray-500 mx-auto mb-2" />
                  <p className="text-white/70">No activities completed yet. Start your cybersecurity journey!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <Card className="bg-black/30 border-green-500/20">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="mr-2 h-5 w-5 text-green-500" />
                Your Achievements
              </CardTitle>
              <CardDescription>Badges and accomplishments you've earned</CardDescription>
            </CardHeader>
            <CardContent>
              {userData.achievements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userData.achievements.map((achievement) => (
                    <div key={achievement.id} className="bg-black/20 border border-green-500/20 rounded-lg p-4 flex items-start space-x-4">
                      <div className="bg-green-500/20 p-3 rounded-full">
                        <Trophy className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="space-y-2">
                        <div>
                          <h3 className="font-medium">{achievement.achievement.name}</h3>
                          <p className="text-sm text-white/70">{achievement.achievement.description}</p>
                        </div>
                        <div className="flex items-center text-xs text-white/70">
                          <Clock className="mr-1 h-3 w-3" />
                          Earned on {formatDate(achievement.earnedAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-white/70">Complete activities to earn achievements!</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Link 
                href="/achievements" 
                className="w-full py-2 px-4 bg-black/30 border border-green-500/30 hover:bg-black/50 text-green-400 font-medium text-sm rounded text-center"
              >
                View All Achievements
              </Link>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Certificates Tab */}
        <TabsContent value="certificates" className="space-y-6">
          <Card className="bg-black/30 border-green-500/20">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="mr-2 h-5 w-5 text-green-500" />
                Your Certificates
              </CardTitle>
              <CardDescription>Certifications you've earned by completing courses</CardDescription>
            </CardHeader>
            <CardContent>
              {userData.certificates.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {userData.certificates.map((certificate) => (
                    <div key={certificate.id} className="bg-black/20 border border-green-500/20 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-lg">{certificate.title}</h3>
                          <p className="text-sm text-white/70 mt-1">{certificate.description}</p>
                        </div>
                        <Badge className="bg-green-600/80">Verified</Badge>
                      </div>
                      
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {certificate.skills.map((skill, index) => (
                            <Badge key={index} variant="outline" className="bg-black/30">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-4 text-sm text-white/70">
                        <div className="flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          Issued on {formatDate(certificate.issueDate)}
                        </div>
                        <div>
                          Verification: {certificate.verificationCode.substring(0, 8)}...
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-white/70">Complete levels to earn certificates!</p>
                  <p className="text-sm text-white/50 mt-2">Certificates are awarded when you master specific cybersecurity domains.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 