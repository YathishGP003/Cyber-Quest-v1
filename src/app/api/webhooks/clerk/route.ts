import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Webhook } from 'svix';
import { headers } from 'next/headers';

// This webhook handler processes Clerk events
// It should be configured in the Clerk dashboard to receive user events
export async function POST(request: NextRequest) {
  try {
    // Get the webhook secret from environment variables
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    
    if (!WEBHOOK_SECRET) {
      console.error('Missing CLERK_WEBHOOK_SECRET');
      return NextResponse.json(
        { error: 'Server misconfigured' },
        { status: 500 }
      );
    }

    // Get the headers
    const headerPayload = headers();
    const svix_id = headerPayload.get('svix-id');
    const svix_timestamp = headerPayload.get('svix-timestamp');
    const svix_signature = headerPayload.get('svix-signature');

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return NextResponse.json(
        { error: 'Missing svix headers' },
        { status: 400 }
      );
    }

    // Get the body
    const payload = await request.json();
    const body = JSON.stringify(payload);

    // Create a new Svix instance with the secret
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: any;
    
    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      });
    } catch (err) {
      console.error('Error verifying webhook:', err);
      return NextResponse.json(
        { error: 'Error verifying webhook' },
        { status: 400 }
      );
    }

    // Handle the webhook
    const eventType = evt.type;
    
    if (eventType === 'user.created') {
      // A new user was created in Clerk
      const { id, email_addresses, first_name, last_name, username } = evt.data;
      
      // Get the primary email
      const primaryEmail = email_addresses.find((email: any) => email.id === evt.data.primary_email_address_id);
      
      if (!primaryEmail) {
        return NextResponse.json(
          { error: 'User has no primary email' },
          { status: 400 }
        );
      }

      // Create the user in our database
      const user = await db.user.create({
        data: {
          clerkId: id,
          email: primaryEmail.email_address,
          firstName: first_name,
          lastName: last_name,
          username,
          currentLevel: 1,
          totalPoints: 0
        }
      });

      // Create initial progress for level 1
      await db.userProgress.create({
        data: {
          userId: user.id,
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
            userId: user.id,
            achievementId: firstStepsAchievement.id
          }
        });
      }

      return NextResponse.json({ success: true, user });
    } 
    else if (eventType === 'user.updated') {
      // User was updated in Clerk
      const { id, email_addresses, first_name, last_name, username } = evt.data;
      
      // Get the primary email
      const primaryEmail = email_addresses.find((email: any) => email.id === evt.data.primary_email_address_id);
      
      if (!primaryEmail) {
        return NextResponse.json(
          { error: 'User has no primary email' },
          { status: 400 }
        );
      }

      // Check if user exists in our database
      const existingUser = await db.user.findUnique({
        where: {
          clerkId: id
        }
      });

      if (existingUser) {
        // Update the user
        const updatedUser = await db.user.update({
          where: {
            clerkId: id
          },
          data: {
            email: primaryEmail.email_address,
            firstName: first_name,
            lastName: last_name,
            username
          }
        });

        return NextResponse.json({ success: true, user: updatedUser });
      } else {
        // Create the user if they don't exist
        const user = await db.user.create({
          data: {
            clerkId: id,
            email: primaryEmail.email_address,
            firstName: first_name,
            lastName: last_name,
            username,
            currentLevel: 1,
            totalPoints: 0
          }
        });

        // Create initial progress for level 1
        await db.userProgress.create({
          data: {
            userId: user.id,
            levelId: 1,
            isCompleted: false,
            pointsEarned: 0,
            activitiesCompleted: 0
          }
        });

        return NextResponse.json({ success: true, user });
      }
    }
    else if (eventType === 'user.deleted') {
      // User was deleted in Clerk
      const { id } = evt.data;

      // Delete the user from our database
      await db.user.delete({
        where: {
          clerkId: id
        }
      });

      return NextResponse.json({ success: true });
    }

    // Return a 200 for any other event type
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 