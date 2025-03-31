import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

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
    
    // In a real implementation, you would send the transcript to an AI service
    // for analysis and get back detailed feedback
    
    // For this implementation, we'll create mock feedback
    const mockFeedback = generateMockFeedback(
      body.transcript, 
      body.role || body.jobTitle || 'Cybersecurity Analyst', 
      body.specialization || 'cybersecurity',
      body.difficulty || 'intermediate'
    );
    
    return NextResponse.json({ 
      success: true, 
      feedback: mockFeedback
    });
  } catch (error) {
    console.error('Error analyzing interview:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

function generateMockFeedback(transcript: any[], role: string, specialization: string, difficulty: string = 'intermediate') {
  // Extract questions and answers
  const interviewContent: Record<string, any> = {};
  let currentQuestion = '';
  
  transcript.forEach(message => {
    if (message.role === 'assistant') {
      currentQuestion = message.content;
    } else if (message.role === 'user' && currentQuestion) {
      // Adjust ratings based on difficulty
      let baseRating = 3.0;
      if (difficulty === 'beginner') {
        baseRating = 3.5; // Slightly higher base rating for beginner interviews
      } else if (difficulty === 'advanced') {
        baseRating = 2.8; // Slightly lower base rating for advanced interviews
      }
      
      interviewContent[currentQuestion] = {
        answer: message.content,
        rating: (baseRating + Math.random() * 2).toFixed(1),
        feedback: getCustomizedFeedback(currentQuestion, message.content, role, difficulty)
      };
    }
  });
  
  // Generate strengths and areas for improvement based on role
  const strengths = getRoleSpecificStrengths(role);
  const areasForImprovement = getRoleSpecificImprovements(role, difficulty);
  
  // Adjust ratings based on difficulty
  let baseOverallRating = 3.5;
  let baseTechnicalRating = 3.0;
  let baseCommunicationRating = 3.0;
  let baseProblemSolvingRating = 3.0;
  
  if (difficulty === 'beginner') {
    baseOverallRating += 0.3;
    baseTechnicalRating += 0.2;
    baseCommunicationRating += 0.3;
    baseProblemSolvingRating += 0.2;
  } else if (difficulty === 'advanced') {
    baseOverallRating -= 0.3;
    baseTechnicalRating -= 0.2;
    baseCommunicationRating -= 0.1;
    baseProblemSolvingRating -= 0.2;
  }
  
  return {
    overallRating: (baseOverallRating + Math.random()).toFixed(1),
    technicalSkills: (baseTechnicalRating + Math.random() * 2).toFixed(1),
    communicationSkills: (baseCommunicationRating + Math.random() * 2).toFixed(1),
    problemSolving: (baseProblemSolvingRating + Math.random() * 2).toFixed(1),
    strengths,
    areasForImprovement,
    detailedFeedback: interviewContent,
    role,
    difficulty
  };
}

function getCustomizedFeedback(question: string, answer: string, role: string, difficulty: string) {
  // Common feedback options
  const commonFeedback = [
    "Good response that covers the basics. Try to provide more specific examples next time.",
    "Strong answer that demonstrates technical knowledge. Consider including more real-world applications.",
    "Excellent explanation with clear structure. Could benefit from more cybersecurity-specific terminology.",
    "Your answer shows understanding but could use more depth in technical details.",
    "Well-articulated response with good examples. Consider addressing potential challenges and solutions."
  ];
  
  // Role-specific feedback
  const roleFeedback: Record<string, string[]> = {
    "Cybersecurity Analyst": [
      "Good analysis skills demonstrated. Consider mentioning specific tools you've used for threat detection.",
      "Your approach to incident response is solid. Elaborate more on triage procedures next time."
    ],
    "Security Engineer": [
      "Your technical knowledge is evident. Try to include more specific implementation details.",
      "Good understanding of security architecture. Consider discussing scalability challenges in your next response."
    ],
    "Penetration Tester": [
      "Your methodology is sound. Discuss more about post-exploitation phases in future responses.",
      "Good explanation of testing procedures. Include more about how you document and report findings."
    ],
    "Security Architect": [
      "Solid architectural principles mentioned. Elaborate more on how you balance security with usability.",
      "Good high-level design approach. Consider including more about compliance requirements in your answers."
    ],
    "SOC Analyst": [
      "Good monitoring approach. Discuss alert correlation techniques more specifically next time.",
      "Your incident response knowledge is solid. Consider explaining your escalation procedures in more detail."
    ]
  };
  
  // Difficulty-specific advice
  const difficultyAdvice: Record<string, string[]> = {
    "beginner": [
      "Good start! As you progress, try to incorporate more industry-specific terminology.",
      "Solid foundational knowledge. Building more hands-on experience will strengthen your responses."
    ],
    "intermediate": [
      "Good technical depth. Try to connect your technical knowledge with business impacts.",
      "Solid practical answers. Consider discussing how you've optimized processes or solutions."
    ],
    "advanced": [
      "Your expertise is evident, but consider addressing more complex edge cases in your responses.",
      "Good advanced knowledge. Try to include more about strategic approaches and long-term security planning."
    ]
  };
  
  // Select feedback based on role, difficulty, and random selection
  const roleSpecificFeedback = roleFeedback[role] || roleFeedback["Cybersecurity Analyst"];
  const difficultySpecificAdvice = difficultyAdvice[difficulty] || difficultyAdvice["intermediate"];
  
  const allFeedback = [...commonFeedback, ...roleSpecificFeedback, ...difficultySpecificAdvice];
  return allFeedback[Math.floor(Math.random() * allFeedback.length)];
}

function getRoleSpecificStrengths(role: string) {
  const commonStrengths = [
    "Demonstrates understanding of cybersecurity principles",
    "Shows ability to communicate technical concepts",
    "Provides examples from previous experience"
  ];
  
  const roleStrengths: Record<string, string[]> = {
    "Cybersecurity Analyst": [
      "Shows strong analytical thinking",
      "Demonstrates threat awareness",
      "Exhibits good knowledge of detection methodologies"
    ],
    "Security Engineer": [
      "Demonstrates solid technical implementation knowledge",
      "Shows understanding of security architecture",
      "Exhibits problem-solving skills for complex systems"
    ],
    "Penetration Tester": [
      "Shows methodical approach to testing",
      "Demonstrates knowledge of exploitation techniques",
      "Exhibits good understanding of vulnerability assessment"
    ],
    "Security Architect": [
      "Demonstrates holistic security thinking",
      "Shows understanding of defense-in-depth principles",
      "Exhibits knowledge of secure design patterns"
    ],
    "SOC Analyst": [
      "Shows strong incident response knowledge",
      "Demonstrates alert triage skills",
      "Exhibits threat hunting capabilities"
    ]
  };
  
  const specificStrengths = roleStrengths[role] || roleStrengths["Cybersecurity Analyst"];
  
  // Return a mix of common and role-specific strengths
  return [...commonStrengths, ...specificStrengths].slice(0, 4);
}

function getRoleSpecificImprovements(role: string, difficulty: string) {
  const commonImprovements = [
    "Include more technical terminology specific to cybersecurity",
    "Provide more detailed and comprehensive responses",
    "Improve response structure with clearer organization"
  ];
  
  const roleImprovements: Record<string, string[]> = {
    "Cybersecurity Analyst": [
      "Expand knowledge of threat intelligence sources",
      "Develop deeper understanding of SIEM correlation rules",
      "Enhance incident response documentation skills"
    ],
    "Security Engineer": [
      "Deepen knowledge of secure coding practices",
      "Expand understanding of cloud security controls",
      "Develop stronger security automation skills"
    ],
    "Penetration Tester": [
      "Enhance knowledge of advanced exploitation techniques",
      "Improve reporting of business impacts for vulnerabilities",
      "Develop deeper understanding of post-exploitation methodology"
    ],
    "Security Architect": [
      "Strengthen knowledge of compliance frameworks",
      "Develop more comprehensive risk assessment skills",
      "Enhance understanding of secure integration patterns"
    ],
    "SOC Analyst": [
      "Deepen knowledge of attacker tactics and techniques",
      "Enhance log analysis skills",
      "Improve alert prioritization methodology"
    ]
  };
  
  const difficultyImprovements: Record<string, string[]> = {
    "beginner": [
      "Build more hands-on experience with security tools",
      "Develop stronger technical foundation in core concepts"
    ],
    "intermediate": [
      "Connect technical details with business context more effectively",
      "Develop more specialized expertise in key areas"
    ],
    "advanced": [
      "Address more complex edge cases in responses",
      "Develop more strategic perspectives on security challenges",
      "Articulate more innovative approaches to security problems"
    ]
  };
  
  const specificImprovements = roleImprovements[role] || roleImprovements["Cybersecurity Analyst"];
  const difficultySpecificImprovements = difficultyImprovements[difficulty] || difficultyImprovements["intermediate"];
  
  // Return a mix of common, role-specific, and difficulty-specific improvements
  return [...commonImprovements, ...specificImprovements, ...difficultySpecificImprovements].slice(0, 4);
} 