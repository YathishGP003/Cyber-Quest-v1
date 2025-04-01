import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import crypto from 'crypto';

export async function POST() {
  try {
    const authObj = await auth();
    const userId = authObj.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the user from our database
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
    
    // Check if user has 1500 points
    if (user.totalPoints < 1500) {
      return NextResponse.json(
        { error: 'Insufficient points. 1500 points required to generate certificate.' },
        { status: 403 }
      );
    }
    
    // Generate a unique verification code
    const verificationCode = crypto.randomBytes(16).toString('hex');
    
    // Certificate details
    const title = "Cybersecurity Master Certificate";
    const description = "This certificate is awarded for completing the cybersecurity training program with excellence.";
    const skills = [
      "Security Fundamentals",
      "Network Security",
      "Web Security",
      "Cryptography",
      "Authentication & Authorization",
      "Social Engineering",
      "Malware Analysis",
      "Digital Forensics",
      "Incident Response",
      "Advanced Persistent Threats"
    ];
    
    // Check if user already has this certificate
    const existingCertificate = await db.certificate.findFirst({
      where: {
        userId: user.id,
        title: title
      }
    });
    
    // If certificate already exists, return it
    if (existingCertificate) {
      return NextResponse.json(existingCertificate);
    }
    
    // Create the certificate
    const certificate = await db.certificate.create({
      data: {
        userId: user.id,
        title,
        description,
        skills,
        verificationCode,
        issueDate: new Date()
      }
    });
    
    return NextResponse.json(certificate);
  } catch (error) {
    console.error('Error generating certificate:', error);
    return NextResponse.json(
      { error: 'Failed to generate certificate' },
      { status: 500 }
    );
  }
} 