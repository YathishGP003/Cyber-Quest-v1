import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Get all levels with their activities
    const levels = await db.level.findMany({
      orderBy: {
        order: 'asc'
      },
      include: {
        activities: {
          orderBy: {
            order: 'asc'
          },
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            points: true,
            order: true,
            isRequired: true
          }
        }
      }
    });

    return NextResponse.json(levels);
  } catch (error) {
    console.error('Error fetching levels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch levels' },
      { status: 500 }
    );
  }
} 