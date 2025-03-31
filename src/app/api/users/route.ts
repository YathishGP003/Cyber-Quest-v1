import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

// This route is used to create or update a user in our database
// It should be called when a user signs up or updates their profile in Clerk
export async function POST(request: NextRequest) {
  try {
    const authObj = await auth();
    const clerkUserId = authObj.userId;
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user data from request body
    const { email, firstName, lastName, username } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: {
        clerkId: clerkUserId
      }
    });

    if (existingUser) {
      // Update the user
      const updatedUser = await db.user.update({
        where: {
          clerkId: clerkUserId
        },
        data: {
          email,
          firstName,
          lastName,
          username
        }
      });

      return NextResponse.json(updatedUser);
    } else {
      // Create a new user
      const newUser = await db.user.create({
        data: {
          clerkId: clerkUserId,
          email,
          firstName,
          lastName,
          username,
          currentLevel: 1,
          totalPoints: 0
        }
      });

      // Create initial progress for level 1
      await db.userProgress.create({
        data: {
          userId: newUser.id,
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
            userId: newUser.id,
            achievementId: firstStepsAchievement.id
          }
        });
      }

      return NextResponse.json(newUser);
    }
  } catch (error) {
    console.error('Error creating/updating user:', error);
    return NextResponse.json(
      { error: 'Failed to create/update user' },
      { status: 500 }
    );
  }
}

// Get current user data
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

    const user = await db.user.findUnique({
      where: {
        clerkId: userId
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
} 