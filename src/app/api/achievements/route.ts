import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Get all achievements
    const achievements = await db.achievement.findMany({
      include: {
        level: {
          select: {
            name: true,
            order: true
          }
        }
      },
      orderBy: {
        id: 'asc'
      }
    });

    return NextResponse.json(achievements);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
} 