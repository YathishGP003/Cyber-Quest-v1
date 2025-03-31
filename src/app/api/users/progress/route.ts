import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const authObj = await auth();
    const userId = authObj.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user progress for all levels
    const userProgress = await db.userProgress.findMany({
      where: {
        userId
      },
      include: {
        level: true,
        activityProgress: {
          include: {
            activity: true
          }
        }
      },
      orderBy: {
        level: {
          order: 'asc'
        }
      }
    });

    // Get user achievements
    const userAchievements = await db.userAchievement.findMany({
      where: {
        userId
      },
      include: {
        achievement: true
      }
    });

    // Get user certificates
    const userCertificates = await db.certificate.findMany({
      where: {
        userId
      }
    });

    // Get user details
    const user = await db.user.findUnique({
      where: {
        id: userId
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        currentLevel: true,
        totalPoints: true
      }
    });

    return NextResponse.json({
      user,
      progress: userProgress,
      achievements: userAchievements,
      certificates: userCertificates
    });
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user progress' },
      { status: 500 }
    );
  }
} 