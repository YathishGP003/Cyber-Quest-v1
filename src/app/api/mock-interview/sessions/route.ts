import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import crypto from 'crypto';

// Simulate a database of interview sessions
// In a real app, you would use your database instead
let mockInterviewSessions: any[] = [];

// Generate a UUID using crypto since uuid module isn't available
function generateUUID() {
  return crypto.randomUUID();
}

export async function POST(req: NextRequest) {
  try {
    const authObj = await auth();
    const userId = authObj.userId;
    
    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized' 
        },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    
    // Validate required fields
    if (!body.transcript) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields' 
        },
        { status: 400 }
      );
    }
    
    // Create a new session
    const sessionId = generateUUID();
    const newSession = {
      id: sessionId,
      userId: body.userId || userId,
      transcript: body.transcript,
      interviewId: body.interviewId || null,
      feedbackId: body.feedbackId || null,
      jobTitle: body.role || body.jobTitle || 'Cybersecurity Professional',
      specialization: body.specialization || 'cybersecurity',
      difficulty: body.difficulty || 'intermediate',
      createdAt: new Date().toISOString()
    };
    
    // Save to our mock database
    mockInterviewSessions.push(newSession);
    
    return NextResponse.json({ 
      success: true, 
      sessionId 
    });
  } catch (error) {
    console.error('Error saving interview session:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const authObj = await auth();
    const userId = authObj.userId;
    
    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized' 
        },
        { status: 401 }
      );
    }
    
    // Get sessionId from URL params
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId');
    
    if (sessionId) {
      // Find specific session
      const session = mockInterviewSessions.find(session => session.id === sessionId);
      
      if (!session) {
        // For demo purposes, create a mock session if not found
        const mockSession = {
          id: sessionId,
          userId,
          transcript: [
            { role: 'assistant', content: 'Tell me about your experience in cybersecurity.' },
            { role: 'user', content: 'I have been working in cybersecurity for 3 years, focusing on network security and penetration testing.' },
            { role: 'assistant', content: 'What approaches do you take to secure a system?' },
            { role: 'user', content: 'I follow a defense-in-depth strategy, implementing multiple layers of security controls.' },
            { role: 'assistant', content: 'How do you stay updated with the latest security threats?' },
            { role: 'user', content: 'I regularly follow security blogs, participate in forums, and attend conferences.' }
          ],
          jobTitle: 'Cybersecurity Analyst',
          specialization: 'cybersecurity',
          createdAt: new Date().toISOString()
        };
        
        return NextResponse.json({ 
          success: true, 
          session: mockSession 
        });
      }
      
      return NextResponse.json({ 
        success: true, 
        session 
      });
    } else {
      // Get all sessions for the user
      const userSessions = mockInterviewSessions.filter(session => session.userId === userId);
      
      return NextResponse.json({ 
        success: true, 
        sessions: userSessions 
      });
    }
  } catch (error) {
    console.error('Error retrieving interview sessions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
} 