import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { levelId: string } }
) {
  try {
    const levelId = parseInt(params.levelId);

    if (isNaN(levelId)) {
      return NextResponse.json(
        { error: 'Invalid level ID' },
        { status: 400 }
      );
    }

    // Get the level with all its activities
    const level = await db.level.findUnique({
      where: {
        id: levelId
      },
      include: {
        activities: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    if (!level) {
      return NextResponse.json(
        { error: 'Level not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(level);
  } catch (error) {
    console.error(`Error fetching level ${params.levelId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch level' },
      { status: 500 }
    );
  }
} 