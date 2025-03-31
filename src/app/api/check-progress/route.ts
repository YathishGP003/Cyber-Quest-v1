import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Check if the user exists
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: {
        progress: {
          include: {
            level: true,
            activityProgress: {
              include: {
                activity: true
              }
            }
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Calculate user's total points from all levels
    let fixedIssues = [];
    let totalCalculatedPoints = 0;
    
    // Process each level
    for (const progress of user.progress) {
      let levelPoints = 0;
      let completedActivities = 0;
      
      // Calculate points earned from activities in this level
      for (const activityProgress of progress.activityProgress) {
        if (activityProgress.isCompleted) {
          // If activity is completed but has 0 points, fix it
          if (activityProgress.pointsEarned === 0 && activityProgress.activity) {
            // For reading activities, award full points; for others use 70% (passing score)
            const fixedPoints = activityProgress.activity.type === "READING" 
              ? activityProgress.activity.points 
              : Math.round(0.7 * activityProgress.activity.points);
              
            // Update the activity progress with fixed points
            await db.activityProgress.update({
              where: { id: activityProgress.id },
              data: { pointsEarned: fixedPoints }
            });
            
            // Use the fixed points in our calculation
            levelPoints += fixedPoints;
            
            fixedIssues.push({
              activityId: activityProgress.activityId,
              oldPoints: activityProgress.pointsEarned,
              newPoints: fixedPoints
            });
          } else {
            levelPoints += activityProgress.pointsEarned;
          }
          completedActivities++;
        }
      }
      
      // Update user progress if it doesn't match
      if (progress.pointsEarned !== levelPoints || progress.activitiesCompleted !== completedActivities) {
        await db.userProgress.update({
          where: { id: progress.id },
          data: {
            pointsEarned: levelPoints,
            activitiesCompleted: completedActivities,
            isCompleted: levelPoints >= progress.level.minPointsToPass
          }
        });
        
        fixedIssues.push({
          level: progress.level.order,
          oldPoints: progress.pointsEarned,
          newPoints: levelPoints,
          oldActivitiesCompleted: progress.activitiesCompleted,
          newActivitiesCompleted: completedActivities
        });
      }
      
      totalCalculatedPoints += levelPoints;
    }
    
    // Update user's total points if it doesn't match
    if (user.totalPoints !== totalCalculatedPoints) {
      await db.user.update({
        where: { id: user.id },
        data: {
          totalPoints: totalCalculatedPoints
        }
      });
      
      fixedIssues.push({
        user: user.id,
        oldTotalPoints: user.totalPoints,
        newTotalPoints: totalCalculatedPoints
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      fixedIssues,
      user: {
        id: user.id,
        totalPoints: totalCalculatedPoints,
        currentLevel: user.currentLevel,
        levels: user.progress.map(p => ({
          id: p.levelId,
          order: p.level.order,
          pointsEarned: p.pointsEarned,
          minPointsToPass: p.level.minPointsToPass,
          isCompleted: p.isCompleted,
          activitiesCompleted: p.activitiesCompleted
        }))
      }
    });
  } catch (error: any) {
    console.error("[CHECK_PROGRESS]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 