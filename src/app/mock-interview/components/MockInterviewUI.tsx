"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, X, Brain } from "lucide-react";

interface MockInterviewUIProps {
  userName: string;
  userId: string;
}

type Message = {
  role: "user" | "assistant";
  content: string;
}

// Web Speech API types
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

const MockInterviewUI: React.FC<MockInterviewUIProps> = ({ userName, userId }) => {
  const router = useRouter();
  const [isStarted, setIsStarted] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isInterviewerSpeaking, setIsInterviewerSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [questionCount, setQuestionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [specialization, setSpecialization] = useState<string>("cybersecurity");
  const [jobTitle, setJobTitle] = useState<string>("Cybersecurity Analyst");
  const [transcript, setTranscript] = useState<string>("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<any>(null);
  const maxQuestions = 5;

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize Web Speech API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

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

          setTranscript(finalTranscript || interimTranscript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
        };
      } else {
        console.error('Speech recognition not supported in this browser');
      }
      
      // Audio context for playback (optional)
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors that might occur if recognition wasn't started
        }
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startInterview = () => {
    setIsStarted(true);
    const introMessage = `Hello ${userName}, I'll be your AI interviewer today. I'm going to ask you some questions related to ${jobTitle} position. Please speak clearly when answering. Are you ready?`;
    setMessages([
      { 
        role: "assistant", 
        content: introMessage
      }
    ]);
    setIsInterviewerSpeaking(true);
    
    // Simulate AI speaking
    playTextAsAudio(introMessage);
    setTimeout(() => {
      setIsInterviewerSpeaking(false);
      // Start the first question after intro
      getNextAIQuestion();
    }, 5000);
  };

  const endInterview = () => {
    setIsEnded(true);
    setIsRecording(false);
    
    // Stop recording if active
    stopRecording();
    
    // Add closing message
    const closingMessage = "Thank you for participating in this mock interview. The AI is now analyzing your responses and will provide detailed feedback shortly.";
    setMessages(prev => [
      ...prev, 
      { 
        role: "assistant", 
        content: closingMessage
      }
    ]);
    setIsInterviewerSpeaking(true);
    
    // Simulate AI speaking the closing message
    playTextAsAudio(closingMessage);
    
    // Save the interview transcript to the API
    const saveTranscript = async () => {
      try {
        const response = await fetch('/api/mock-interview/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transcript: messages,
            userId,
            jobTitle,
            specialization
          }),
        });
        
        const data = await response.json();
        if (data.success) {
          console.log('Interview transcript saved:', data.sessionId);
          
          // Simulate AI speaking
          setTimeout(() => {
            setIsInterviewerSpeaking(false);
            // Redirect to feedback page
            router.push(`/mock-interview/feedback?sessionId=${data.sessionId}`);
          }, 5000);
        } else {
          console.error('Failed to save transcript:', data.error);
          alert('Error: Failed to save interview data.');
          router.push('/');
        }
      } catch (error) {
        console.error('Error saving transcript:', error);
        alert('Error: Failed to save interview data.');
        router.push('/');
      }
    };
    
    saveTranscript();
  };

  // Get next AI-generated question
  const getNextAIQuestion = async () => {
    if (questionCount >= maxQuestions) {
      endInterview();
      return;
    }
    
    setIsLoading(true);
    try {
      // In a real implementation, this would call your AI service
      // For now, we'll simulate AI-generated questions
      const previousMessages = messages.map(m => m.content).join("\n");
      
      const response = await fetch('/api/mock-interview/generate-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          previousMessages,
          questionCount,
          specialization,
          jobTitle,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate question');
      }
      
      const data = await response.json();
      const aiQuestion = data.question || getBackupQuestion(questionCount);
      
      setCurrentQuestion(aiQuestion);
      setMessages(prev => [...prev, { role: "assistant", content: aiQuestion }]);
      setIsInterviewerSpeaking(true);
      
      // Simulate AI speaking the question
      playTextAsAudio(aiQuestion);
      
      // After AI finishes speaking, automatically start recording
      setTimeout(() => {
        setIsInterviewerSpeaking(false);
        setIsLoading(false);
        // Reset transcript for new answer
        setTranscript("");
        // Auto-start recording after the AI asks a question
        startRecording();
      }, 3000 + (aiQuestion.length * 80)); // Adjust time based on question length
      
      setQuestionCount(prev => prev + 1);
    } catch (error) {
      console.error("Error generating question:", error);
      // Fallback to backup question
      const backupQuestion = getBackupQuestion(questionCount);
      setCurrentQuestion(backupQuestion);
      setMessages(prev => [...prev, { role: "assistant", content: backupQuestion }]);
      setIsInterviewerSpeaking(true);
      
      // Simulate AI speaking
      playTextAsAudio(backupQuestion);
      
      setTimeout(() => {
        setIsInterviewerSpeaking(false);
        setIsLoading(false);
        // Reset transcript for new answer
        setTranscript("");
        startRecording();
      }, 3000);
      
      setQuestionCount(prev => prev + 1);
    }
  };

  // Fallback questions in case AI generation fails
  const getBackupQuestion = (index: number) => {
    const backupQuestions = [
      `What experience do you have in ${specialization}?`,
      `How do you stay updated with the latest developments in ${specialization}?`,
      `Describe a challenging situation you faced in your ${specialization} work and how you resolved it.`,
      `What technical skills do you consider most important for a ${jobTitle}?`,
      `Where do you see the future of ${specialization} heading in the next few years?`,
    ];
    
    return backupQuestions[index % backupQuestions.length];
  };

  // Simulates text-to-speech (in a real implementation, you would use a proper TTS service)
  const playTextAsAudio = (text: string) => {
    // This is a placeholder. In a real implementation, you would use a proper TTS API
    console.log("Speaking:", text);
    // The actual speaking is just simulated with the isInterviewerSpeaking state
  };

  const startRecording = async () => {
    // Clear previous transcript
    setTranscript("");
    
    try {
      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
        console.log("Speech recognition started");
      } else {
        console.error("Speech recognition not available");
      }
      
      // Also start audio recording as a backup and for possible server-side processing
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // The audio recording has stopped
        console.log("Media recorder stopped");
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // For demo purposes, auto-stop after 30 seconds
      setTimeout(() => {
        stopRecording();
      }, 30000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access your microphone. Please check your browser permissions.");
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsLoading(true);
    
    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        console.log("Speech recognition stopped");
      } catch (e) {
        console.error("Error stopping speech recognition:", e);
      }
    }
    
    // Stop media recorder if running
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      const tracks = mediaRecorderRef.current.stream.getTracks();
      tracks.forEach(track => track.stop());
    }
    
    // Process the transcript
    processTranscript();
  };

  const processTranscript = () => {
    const userResponse = transcript.trim() || "I apologize, but I couldn't provide an answer to this question.";
    
    // Add the user's response to messages
    setMessages(prev => [...prev, { role: "user", content: userResponse }]);
    
    // Wait briefly before next question
    setTimeout(() => {
      setIsLoading(false);
      getNextAIQuestion();
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Interview setup */}
      {!isStarted && (
        <div className="bg-black/30 rounded-lg p-6 border border-green-500/20 mb-4">
          <h3 className="font-semibold text-lg mb-4">Interview Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Job Title
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                placeholder="E.g. Cybersecurity Analyst, Penetration Tester, etc."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Specialization Area
              </label>
              <select
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
              >
                <option value="cybersecurity">Cybersecurity (General)</option>
                <option value="network security">Network Security</option>
                <option value="application security">Application Security</option>
                <option value="cloud security">Cloud Security</option>
                <option value="penetration testing">Penetration Testing</option>
                <option value="security operations">Security Operations</option>
                <option value="compliance">Compliance & Risk Management</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Interview interface */}
      <div className="flex flex-col md:flex-row gap-6 justify-between">
        <div className="flex-1 flex flex-col items-center">
          <div className="w-24 h-24 bg-gray-800 rounded-full overflow-hidden border-2 border-green-500 mb-2 relative">
            <div className="w-full h-full flex items-center justify-center bg-gray-700 text-white text-lg font-semibold">
              <Brain size={32} />
            </div>
            {isInterviewerSpeaking && (
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-green-500 animate-pulse"></div>
            )}
          </div>
          <h3 className="font-medium text-white">AI Interviewer</h3>
        </div>

        <div className="flex-1 flex flex-col items-center">
          <div className="w-24 h-24 bg-gray-800 rounded-full overflow-hidden border-2 border-purple-500 mb-2">
            <div className="w-full h-full flex items-center justify-center bg-gray-700 text-white text-lg font-semibold">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
          <h3 className="font-medium text-white">{userName}</h3>
        </div>
      </div>

      {/* Chat transcript */}
      <div className="border border-gray-700 rounded-lg p-4 h-64 overflow-y-auto bg-black/50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 h-full flex items-center justify-center">
            <p>Configure your interview settings and press Start to begin</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                <div 
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'assistant' 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-green-600 text-white'
                  }`}
                >
                  <p>{message.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current question highlight */}
      {isStarted && !isEnded && currentQuestion && (
        <div className="bg-gray-800/50 rounded-lg p-4 border-l-4 border-green-500">
          <h3 className="font-medium text-green-400 mb-1">Current Question:</h3>
          <p className="text-white text-lg">{currentQuestion}</p>
        </div>
      )}
      
      {/* Live transcript display */}
      {isRecording && (
        <div className="bg-gray-800/50 rounded-lg p-4 border-l-4 border-blue-500">
          <h3 className="font-medium text-blue-400 mb-1">Your Answer (Live Transcription):</h3>
          <p className="text-white">
            {transcript || "Listening..."}
          </p>
        </div>
      )}

      {/* Controls */}
      {!isStarted ? (
        <div className="flex justify-center">
          <button 
            onClick={startInterview}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-medium transition-colors flex items-center gap-2"
          >
            <Brain size={20} />
            Start AI Interview
          </button>
        </div>
      ) : isEnded ? (
        <div className="flex justify-center">
          <button 
            onClick={() => router.push("/")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-medium transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="flex gap-4">
            <button 
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading}
              className={`flex items-center gap-2 ${
                isLoading 
                  ? 'bg-gray-600 cursor-not-allowed'
                  : isRecording 
                    ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                    : 'bg-green-600 hover:bg-green-700'
              } text-white px-8 py-4 rounded-full font-medium transition-colors text-lg`}
            >
              {isLoading ? (
                "Processing..."
              ) : isRecording ? (
                <>
                  <MicOff size={24} />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic size={24} />
                  Record Answer
                </>
              )}
            </button>
            
            <button 
              onClick={endInterview}
              disabled={isLoading}
              className={`bg-red-600 hover:bg-red-700 text-white px-4 py-4 rounded-full font-medium transition-colors flex items-center gap-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <X size={20} />
              End Interview
            </button>
          </div>
        </div>
      )}
      
      {/* Status indicators */}
      {isLoading && (
        <div className="text-center text-blue-400">
          <div className="flex justify-center items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
            <span>AI is thinking...</span>
          </div>
        </div>
      )}
      
      {isRecording && (
        <div className="text-center text-red-400 animate-pulse">
          Recording your answer... (automatically stops after 30 seconds)
        </div>
      )}
      
      {/* Interview progress */}
      {isStarted && !isEnded && (
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full" 
            style={{ width: `${(questionCount / maxQuestions) * 100}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default MockInterviewUI; 