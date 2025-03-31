"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Mic, MicOff } from "lucide-react";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

interface AgentProps {
  userName: string;
  userId: string;
  interviewId?: string;
  feedbackId?: string;
  type: "interview" | "generate";
  questions?: string[];
  role?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
}

// WebSpeech API types
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
  role = "Cybersecurity Analyst",
  difficulty = "intermediate",
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const synth = useRef<SpeechSynthesis | null>(null);
  const isProcessingAnswer = useRef(false);
  const questionIndex = useRef(0);
  
  // Customize interview questions based on role and difficulty
  const getCustomizedQuestions = () => {
    // Base questions for all cybersecurity roles
    const baseQuestions = [
      "Tell me about your experience in cybersecurity.",
      "What approaches do you take to secure a system?",
      "How do you stay updated with the latest security threats?",
      "Describe a security incident you've handled and how you resolved it.",
      "What tools and technologies are you proficient with in the cybersecurity domain?"
    ];

    // Role-specific questions
    const roleQuestions: Record<string, string[]> = {
      "Cybersecurity Analyst": [
        "How would you detect and respond to a potential security breach?",
        "Explain your process for conducting a security audit.",
        "What metrics do you use to measure the effectiveness of security controls?"
      ],
      "Security Engineer": [
        "Describe how you would implement a secure authentication system.",
        "How do you approach security in a cloud environment?",
        "Explain your experience with implementing security automation."
      ],
      "Penetration Tester": [
        "Describe your methodology for conducting a penetration test.",
        "How do you prioritize vulnerabilities found during a penetration test?",
        "What tools do you typically use during penetration testing?"
      ],
      "Security Architect": [
        "How do you design a secure infrastructure from scratch?",
        "Explain your approach to implementing defense in depth.",
        "How do you ensure security requirements are met throughout the SDLC?"
      ],
      "SOC Analyst": [
        "How do you prioritize and triage security alerts?",
        "Describe your experience with SIEM tools.",
        "How would you investigate a potential malware infection?"
      ]
    };

    // Difficulty-specific questions
    const difficultyQuestions: Record<string, string[]> = {
      "beginner": [
        "What are some basic security principles every professional should follow?",
        "How would you explain the concept of defense in depth to a non-technical person?"
      ],
      "intermediate": [
        "How would you implement a zero-trust security model?",
        "Describe a complex security challenge you faced and how you solved it."
      ],
      "advanced": [
        "How would you approach securing a multi-cloud environment with legacy systems?",
        "Explain how you would implement security in a DevOps pipeline.",
        "How would you handle a sophisticated APT (Advanced Persistent Threat) attack?"
      ]
    };

    // Combine questions based on role and difficulty
    const specificRoleQuestions = roleQuestions[role] || roleQuestions["Cybersecurity Analyst"];
    const specificDifficultyQuestions = difficultyQuestions[difficulty] || difficultyQuestions["intermediate"];
    
    return [...baseQuestions, ...specificRoleQuestions, ...specificDifficultyQuestions].slice(0, 5);
  };

  // Update the interviewQuestions to use our dynamic questions
  const interviewQuestions = getCustomizedQuestions();

  // Initialize speech recognition and synthesis
  useEffect(() => {
    // Initialize speech synthesis
    if (typeof window !== 'undefined') {
      synth.current = window.speechSynthesis;

      // Initialize speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        
        recognitionRef.current.onstart = () => {
          setIsListening(true);
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
        
        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }
          
          if (finalTranscript) {
            setTranscript(finalTranscript);
          } else {
            setTranscript(interimTranscript);
          }
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };
      } else {
        console.error('Speech recognition not supported in this browser');
        alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors that might occur if recognition wasn't started
        }
      }
      
      if (synth.current) {
        synth.current.cancel();
      }
    };
  }, []);

  // Monitor transcript for user responses
  useEffect(() => {
    if (transcript && isListening && callStatus === CallStatus.ACTIVE && !isProcessingAnswer.current) {
      // Debounce to ensure we don't capture incomplete responses
      const timer = setTimeout(() => {
        // Stop listening when we detect a substantial response
        if (transcript.trim().split(' ').length > 5) {
          stopListening();
          handleUserResponse(transcript);
        }
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [transcript, isListening, callStatus]);

  // Update last message when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }

    // Process completed interview and redirect
    const handleInterviewEnd = async () => {
      // Add a brief delay to allow the user to read the message
      setTimeout(() => {
        // Redirect to AI dashboard
        router.push("/ai-dashboard");
      }, 3000);
    };

    // Handle the end of the interview
    if (callStatus === CallStatus.FINISHED) {
      handleInterviewEnd();
    }
  }, [messages, callStatus, router, feedbackId, interviewId, type, userId, role, difficulty]);

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Error starting speech recognition:', e);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping speech recognition:', e);
      }
    }
  };

  // Handle user's spoken response
  const handleUserResponse = (response: string) => {
    isProcessingAnswer.current = true;
    
    // Add user's response to messages
    const userMessage: SavedMessage = {
      role: "user",
      content: response
    };
    
    setMessages(prev => [...prev, userMessage]);
    setTranscript("");
    
    // Process the response and ask the next question
    setTimeout(() => {
      askNextQuestion();
      isProcessingAnswer.current = false;
    }, 1000);
  };

  // Speak text using speech synthesis
  const speakText = (text: string) => {
    if (synth.current) {
      synth.current.cancel(); // Stop any current speech
      
      setIsSpeaking(true);
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure voice (optional)
      const voices = synth.current.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Male') || voice.name.includes('Google')
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      utterance.onend = () => {
        setIsSpeaking(false);
        // Start listening for the user's response after the AI finishes speaking
        startListening();
      };
      
      synth.current.speak(utterance);
    }
  };

  // Ask the next interview question
  const askNextQuestion = () => {
    if (questionIndex.current >= interviewQuestions.length) {
      // Interview is complete
      endInterview();
      return;
    }
    
    const question = interviewQuestions[questionIndex.current];
    
    // Add the question to messages
    const assistantMessage: SavedMessage = {
      role: "assistant",
      content: question
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    
    // Speak the question
    speakText(question);
    
    // Increment question index for next time
    questionIndex.current++;
  };

  // Start the interview
  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);
    
    // Reset state
    setMessages([]);
    setTranscript("");
    questionIndex.current = 0;
    
    // Short delay to simulate connection
    setTimeout(() => {
      setCallStatus(CallStatus.ACTIVE);
      
      // Introduction message
      const introMessage = `Hello ${userName}, I'll be your AI interviewer today for a cybersecurity position. I'll ask you a series of questions. Please speak clearly when answering.`;
      
      const assistantMessage: SavedMessage = {
        role: "assistant",
        content: introMessage
      };
      
      setMessages([assistantMessage]);
      
      // Speak the introduction
      speakText(introMessage);
      
      // Ask first question after introduction
      setTimeout(() => {
        askNextQuestion();
      }, 1000);
    }, 1500);
  };

  // End the interview
  const endInterview = () => {
    // Stop any ongoing speech or listening
    if (synth.current) {
      synth.current.cancel();
    }
    
    stopListening();
    setIsListening(false);
    setIsSpeaking(false);
    
    // Closing message with well wishes for their real interview
    const closingMessage = "Thank you for completing this interview. Your responses were excellent. I hope you do well in your real interview!";
    
    const assistantMessage: SavedMessage = {
      role: "assistant",
      content: closingMessage
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    
    // Speak the closing message
    speakText(closingMessage);
    
    // End the call after the closing message
    setTimeout(() => {
      setCallStatus(CallStatus.FINISHED);
    }, 5000);
  };

  // Manually end the interview with goodbye message
  const handleDisconnect = () => {
    if (synth.current) {
      synth.current.cancel();
    }
    
    stopListening();
    setIsListening(false);
    setIsSpeaking(false);
    
    // Add a goodbye message
    const goodbyeMessage = "Thanks for attending the interview. I hope you do well in your real interview!";
    const assistantMessage: SavedMessage = {
      role: "assistant",
      content: goodbyeMessage
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    
    // End the call after a brief delay
    setTimeout(() => {
      setCallStatus(CallStatus.FINISHED);
    }, 2000);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row gap-8 justify-between items-center my-8">
        {/* AI Interviewer Card */}
        <div className="flex flex-col items-center p-6 bg-black/40 rounded-lg border border-green-500/20">
          <div className="relative">
            <Image
              src="/images/ai-avatar.png"
              alt="AI Interviewer"
              width={80}
              height={80}
              className="rounded-full object-cover"
            />
            {isSpeaking && <span className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 rounded-full animate-pulse" />}
          </div>
          <h3 className="mt-2 text-xl font-medium">AI Interviewer</h3>
          <span className="text-xs text-gray-400 mt-1">
            {isSpeaking ? "Speaking..." : "Listening..."}
          </span>
        </div>

        {/* User Profile Card */}
        <div className="flex flex-col items-center p-6 bg-black/40 rounded-lg border border-green-500/20">
          <div className="relative">
            <Image
              src="/images/user-avatar.png"
              alt="User"
              width={80}
              height={80}
              className="rounded-full object-cover"
            />
            {isListening && <span className="absolute bottom-0 right-0 h-4 w-4 bg-blue-500 rounded-full animate-pulse" />}
          </div>
          <h3 className="mt-2 text-xl font-medium">{userName}</h3>
          <div className="flex items-center mt-1">
            {isListening ? (
              <Mic size={16} className="text-blue-500 mr-1" />
            ) : (
              <MicOff size={16} className="text-gray-500 mr-1" />
            )}
            <span className="text-xs text-gray-400">
              {isListening ? "Microphone active" : "Microphone inactive"}
            </span>
          </div>
        </div>
      </div>

      {/* Transcript display */}
      {messages.length > 0 && (
        <div className="my-6 p-4 bg-black/30 rounded-lg border border-green-500/20">
          <p
            key={lastMessage}
            className={cn(
              "transition-opacity duration-500 opacity-0",
              "animate-in fade-in opacity-100"
            )}
          >
            {lastMessage}
          </p>
        </div>
      )}

      {/* Live transcript (what user is currently saying) */}
      {isListening && transcript && (
        <div className="my-4 p-3 bg-black/20 rounded-lg border border-blue-500/20">
          <p className="text-gray-400 text-sm italic">
            {transcript}
          </p>
        </div>
      )}

      {/* Control buttons */}
      <div className="w-full flex justify-center mt-6">
        {callStatus !== "ACTIVE" ? (
          <button 
            className={cn(
              "px-6 py-3 rounded-lg font-medium transition-all",
              "bg-green-500 hover:bg-green-600 text-black",
              callStatus === "CONNECTING" && "animate-pulse"
            )} 
            onClick={() => handleCall()}
            disabled={callStatus === "CONNECTING"}
          >
            {callStatus === "INACTIVE" || callStatus === "FINISHED"
              ? "Start Interview"
              : "Connecting..."}
          </button>
        ) : (
          <button 
            className="px-6 py-3 rounded-lg font-medium transition-all bg-red-500 hover:bg-red-600 text-white" 
            onClick={() => handleDisconnect()}
          >
            End Interview
          </button>
        )}
      </div>
    </>
  );
};

export default Agent; 