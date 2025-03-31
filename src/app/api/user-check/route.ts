import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user exists in the database
    const existingUser = await db.user.findUnique({
      where: { clerkId: userId }
    });

    if (existingUser) {
      return NextResponse.json({ 
        exists: true, 
        user: existingUser 
      });
    }

    // If user doesn't exist, get their details from Clerk
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return NextResponse.json({ error: "Could not retrieve user data" }, { status: 400 });
    }

    // Get primary email
    const primaryEmail = clerkUser.emailAddresses.find(
      email => email.id === clerkUser.primaryEmailAddressId
    );

    if (!primaryEmail) {
      return NextResponse.json({ error: "User has no primary email" }, { status: 400 });
    }

    // Create the user in our database
    const newUser = await db.user.create({
      data: {
        clerkId: userId,
        email: primaryEmail.emailAddress,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        username: clerkUser.username,
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

    return NextResponse.json({ 
      exists: false, 
      created: true, 
      user: newUser 
    });
    
  } catch (error: any) {
    console.error("Error checking/creating user:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 