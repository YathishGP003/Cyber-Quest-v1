import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

// This is a development helper endpoint to manually create users
// after they sign up with Clerk, simulating what the webhook would do
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

    // Check if user already exists in our database by clerkId
    const existingUser = await db.user.findUnique({
      where: { clerkId: userId }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists in database', user: existingUser },
        { status: 200 }
      );
    }

    // Get user info from Clerk (in a real app, this would be from the webhook payload)
    const body = await request.json();
    const { email, firstName, lastName, username, currentLevel, totalPoints } = body;

    // Create the user in our database with a generated ID and the clerkId
    const user = await db.user.create({
      data: {
        clerkId: userId,
        email: email || 'user@example.com', // Fallback values for testing
        firstName: firstName || 'Test',
        lastName: lastName || 'User',
        username: username || 'testuser',
        currentLevel: currentLevel || 1,
        totalPoints: totalPoints || 0
      }
    });

    // Create initial progress for level 1
    await db.userProgress.create({
      data: {
        userId: user.id, // Use the generated user.id, not clerkId
        levelId: 1,
        isCompleted: false,
        pointsEarned: 0,
        activitiesCompleted: 0
      }
    });

    // Award the "First Steps" achievement
    const firstStepsAchievement = await db.achievement.findFirst({
      where: {
        name: 'First Steps'
      }
    });

    if (firstStepsAchievement) {
      await db.userAchievement.create({
        data: {
          userId: user.id, // Use the generated user.id, not clerkId
          achievementId: firstStepsAchievement.id
        }
      });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 