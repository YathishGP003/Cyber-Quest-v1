import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

// Get user achievements
export async function GET() {
  try {
    const authObj = await auth();
    const userId = authObj.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userAchievements = await db.userAchievement.findMany({
      where: {
        userId
      },
      include: {
        achievement: true
      },
      orderBy: {
        earnedAt: 'desc'
      }
    });

    return NextResponse.json(userAchievements);
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user achievements' },
      { status: 500 }
    );
  }
}

// Award an achievement to a user
export async function POST(request: NextRequest) {
  try {
    const authObj = await auth();
    const userId = authObj.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { achievementId } = await request.json();
    
    if (!achievementId) {
      return NextResponse.json(
        { error: 'Achievement ID is required' },
        { status: 400 }
      );
    }

    // Check if achievement exists
    const achievement = await db.achievement.findUnique({
      where: {
        id: achievementId
      }
    });

    if (!achievement) {
      return NextResponse.json(
        { error: 'Achievement not found' },
        { status: 404 }
      );
    }

    // Check if user already has this achievement
    const existingAchievement = await db.userAchievement.findFirst({
      where: {
        userId,
        achievementId
      }
    });

    if (existingAchievement) {
      return NextResponse.json(
        { error: 'User already has this achievement' },
        { status: 400 }
      );
    }

    // Award the achievement
    const userAchievement = await db.userAchievement.create({
      data: {
        userId,
        achievementId
      }
    });

    // Update user's total points
    await db.user.update({
      where: {
        id: userId
      },
      data: {
        totalPoints: {
          increment: achievement.pointsValue
        }
      }
    });

    return NextResponse.json(userAchievement);
  } catch (error) {
    console.error('Error awarding achievement:', error);
    return NextResponse.json(
      { error: 'Failed to award achievement' },
      { status: 500 }
    );
  }
} 