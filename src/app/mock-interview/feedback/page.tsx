"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function FeedbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] = useState<{
    id: string;
    jobTitle: string;
    specialization: string;
    createdAt: string;
  } | null>(null);

  useEffect(() => {
    if (!sessionId) {
      // No session ID provided, redirect to main page
      router.push('/');
      return;
    }

    // Save the sessionId to localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastInterviewSessionId', sessionId);
    }

    const fetchInterviewData = async () => {
      try {
        // First, fetch the interview transcript from the sessions API
        const sessionResponse = await fetch(`/api/mock-interview/sessions?sessionId=${sessionId}`);
        
        if (!sessionResponse.ok) {
          throw new Error('Failed to fetch interview session data');
        }
        
        const sessionData = await sessionResponse.json();
        
        if (!sessionData.success || !sessionData.session) {
          throw new Error('Invalid session data returned');
        }

        // Store basic session info for display
        setSessionInfo({
          id: sessionData.session.id,
          jobTitle: sessionData.session.jobTitle || 'Cybersecurity Professional',
          specialization: sessionData.session.specialization || 'cybersecurity',
          createdAt: sessionData.session.createdAt || new Date().toISOString()
        });
        
        // Now send the transcript to our analysis API
        const analysisResponse = await fetch('/api/mock-interview/analyze-feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transcript: sessionData.session.transcript,
            jobTitle: sessionData.session.jobTitle || 'Cybersecurity Professional',
            specialization: sessionData.session.specialization || 'cybersecurity',
          }),
        });
        
        if (!analysisResponse.ok) {
          throw new Error('Failed to analyze interview');
        }
        
        const analysisData = await analysisResponse.json();
        
        if (!analysisData.success || !analysisData.feedback) {
          throw new Error('Invalid feedback data returned');
        }
        
        setFeedback(analysisData.feedback);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching feedback:', err);
        setError('Failed to generate interview feedback. Please try again later.');
        setLoading(false);
        
        // For demo purposes only: If the API fails, fall back to simulated feedback
        // In a production environment, you'd want to show an error instead
        simulateFeedback();
      }
    };
    
    // For demo purposes, simulate a session API
    const simulateFeedback = () => {
      // This is a fallback in case the API calls fail
      setTimeout(() => {
        setFeedback({
          overallRating: "3.8",
          technicalSkills: "4.1",
          communicationSkills: "3.5",
          problemSolving: "3.9",
          strengths: [
            "Demonstrates understanding of cybersecurity principles",
            "Shows ability to communicate technical concepts",
            "Provides examples from previous experience"
          ],
          areasForImprovement: [
            "Include more technical terminology specific to cybersecurity",
            "Provide more detailed and comprehensive responses",
            "Improve response structure with clearer organization"
          ],
          detailedFeedback: {
            "What experience do you have in cybersecurity?": {
              answer: "I have been working in the field for 3 years, focusing on network security and vulnerability assessments.",
              rating: "3.8",
              feedback: "Good overview of experience, but could benefit from more specific projects or accomplishments."
            },
            "How do you stay updated with the latest security threats?": {
              answer: "I follow several security blogs, participate in forums, and attend online conferences when possible.",
              rating: "4.2",
              feedback: "Strong answer that shows commitment to continuous learning. Consider mentioning specific resources you use."
            }
          }
        });
        setLoading(false);
      }, 1500);
    };

    fetchInterviewData();
  }, [sessionId, router]);

  // Check for a stored session ID on first render
  useEffect(() => {
    if (typeof window !== 'undefined' && !sessionId) {
      const savedSessionId = localStorage.getItem('lastInterviewSessionId');
      if (savedSessionId) {
        router.replace(`/mock-interview/feedback?sessionId=${savedSessionId}`);
      }
    }
  }, [router, sessionId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          <p className="mt-4 text-gray-400">Analyzing your interview and generating feedback...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="bg-red-900/30 rounded-lg p-6 border border-red-500/20 text-center">
          <h2 className="text-xl font-semibold mb-4 text-red-400">Error</h2>
          <p className="text-white mb-6">{error}</p>
          <Link href="/mock-interview" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-medium transition-colors">
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2 text-center">Interview Feedback</h1>
      <p className="text-center mb-2 text-gray-400">
        AI-generated assessment of your interview performance
      </p>
      
      {sessionInfo && (
        <div className="text-center mb-8 text-sm text-gray-500">
          <p>
            {new Date(sessionInfo.createdAt).toLocaleDateString()} | {sessionInfo.jobTitle} | {sessionInfo.specialization}
          </p>
          <p className="text-xs mt-1">
            Session ID: {sessionInfo.id}
          </p>
        </div>
      )}

      {/* Overall Rating */}
      <div className="bg-black/30 rounded-lg p-6 mb-6 border border-green-500/20">
        <h2 className="text-xl font-semibold mb-4">Overall Performance</h2>
        <div className="flex justify-between items-center mb-4">
          <span>Overall Rating:</span>
          <div className="flex items-center">
            <span className="text-2xl font-bold text-green-500 mr-2">{feedback?.overallRating}</span>
            <span className="text-gray-400">/5.0</span>
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1">
              <span>Technical Skills</span>
              <span>{feedback?.technicalSkills}/5.0</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${(parseFloat(feedback?.technicalSkills) / 5) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span>Communication</span>
              <span>{feedback?.communicationSkills}/5.0</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ width: `${(parseFloat(feedback?.communicationSkills) / 5) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span>Problem Solving</span>
              <span>{feedback?.problemSolving}/5.0</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full" 
                style={{ width: `${(parseFloat(feedback?.problemSolving) / 5) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Strengths and Areas for Improvement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-black/30 rounded-lg p-6 border border-green-500/20">
          <h2 className="text-xl font-semibold mb-4 text-green-500">Strengths</h2>
          <ul className="list-disc pl-5 space-y-2">
            {feedback?.strengths.map((strength: string, index: number) => (
              <li key={index}>{strength}</li>
            ))}
          </ul>
        </div>
        
        <div className="bg-black/30 rounded-lg p-6 border border-red-500/20">
          <h2 className="text-xl font-semibold mb-4 text-red-500">Areas for Improvement</h2>
          <ul className="list-disc pl-5 space-y-2">
            {feedback?.areasForImprovement.map((area: string, index: number) => (
              <li key={index}>{area}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Detailed Feedback */}
      <div className="bg-black/30 rounded-lg p-6 mb-6 border border-green-500/20">
        <h2 className="text-xl font-semibold mb-4">Question-by-Question Analysis</h2>
        <div className="space-y-6">
          {feedback && Object.entries(feedback.detailedFeedback).map(([question, data]: [string, any], index: number) => (
            <div key={index} className="border-b border-gray-700 pb-4 last:border-b-0 last:pb-0">
              <h3 className="font-medium mb-2">{question}</h3>
              <div className="flex items-center mb-2">
                <div className="h-6 w-6 rounded-full mr-2 flex items-center justify-center text-xs" 
                  style={{ 
                    backgroundColor: getRatingColor(data.rating),
                    color: 'white'
                  }}
                >
                  {data.rating}
                </div>
                <p className="text-gray-400">{data.answer}</p>
              </div>
              <p className="text-sm text-gray-500">{data.feedback}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <Link href="/mock-interview" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-medium transition-colors">
          New Interview
        </Link>
        <Link href="/" className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-full font-medium transition-colors">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

function getRatingColor(rating: string | number): string {
  const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;
  
  if (numRating >= 4.5) return '#22c55e'; // green-500
  if (numRating >= 4) return '#16a34a';   // green-600
  if (numRating >= 3.5) return '#3b82f6'; // blue-500
  if (numRating >= 3) return '#6366f1';   // indigo-500
  if (numRating >= 2.5) return '#a855f7'; // purple-500
  if (numRating >= 2) return '#f97316';   // orange-500
  return '#ef4444';                       // red-500
} 