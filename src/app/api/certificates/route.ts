import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import crypto from 'crypto';

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

    // Get the request body
    const { title, description, skills } = await request.json();
    
    if (!title || !description || !skills || !Array.isArray(skills)) {
      return NextResponse.json(
        { error: 'Invalid certificate data' },
        { status: 400 }
      );
    }

    // Generate a unique verification code
    const verificationCode = crypto.randomBytes(16).toString('hex');

    // Create the certificate
    const certificate = await db.certificate.create({
      data: {
        userId,
        title,
        description,
        skills,
        verificationCode,
        issueDate: new Date()
      }
    });

    return NextResponse.json(certificate);
  } catch (error) {
    console.error('Error creating certificate:', error);
    return NextResponse.json(
      { error: 'Failed to create certificate' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (code) {
      // Verify a certificate by its verification code
      const certificate = await db.certificate.findUnique({
        where: {
          verificationCode: code
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!certificate) {
        return NextResponse.json(
          { error: 'Certificate not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(certificate);
    } else {
      // Get all certificates (admin only or public ones)
      const certificates = await db.certificate.findMany({
        orderBy: {
          issueDate: 'desc'
        }
      });

      return NextResponse.json(certificates);
    }
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch certificates' },
      { status: 500 }
    );
  }
} 