"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CheckCircle, Terminal, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import SecurityDetectiveLab from "./SecurityDetectiveLab";
import FirewallSimulatorLab from "./FirewallSimulatorLab";
import SQLInjectionLab from "./SQLInjectionLab";
import CryptoHashingLab from "./CryptoHashingLab";
import AuthBypassLab from "./AuthBypassLab";
import AccessControlMatrixLab from "./AccessControlMatrixLab";
import MFADemoLab from "./MFADemoLab";
import SocialEngineeringLab from "./SocialEngineeringLab";
import MalwareAnalysisLab from "./MalwareAnalysisLab";
import DigitalForensicsLab from "./DigitalForensicsLab";
import IncidentResponseLab from "./IncidentResponseLab";
import APTLab from "./APTLab";

interface LabContent {
  title: string;
  description: string;
  instructions: string;
  setupGuide: string;
  tasks: {
    id: string;
    description: string;
    hint?: string;
    solution?: string;
  }[];
  resources?: {
    name: string;
    url: string;
  }[];
}

interface LabActivityProps {
  activity: any;
  userId: string;
  progress: any;
}

export default function LabActivity({ activity, userId, progress }: LabActivityProps) {
  const router = useRouter();
  const [isCompleted, setIsCompleted] = useState(progress?.isCompleted || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});
  const [showSolutions, setShowSolutions] = useState<Record<string, boolean>>({});
  
  // Parse content
  const content: LabContent = typeof activity.content === 'string'
    ? JSON.parse(activity.content)
    : activity.content || {
      title: "Lab Exercise",
      description: "This is a hands-on lab where you'll practice security concepts.",
      instructions: "Follow the steps below to complete this lab.",
      setupGuide: "This lab requires no special setup.",
      tasks: [
        {
          id: "task1",
          description: "This lab has not been configured with content yet.",
          hint: "Check back later for this lab content.",
        }
      ]
    };
  
  // Check if this is a Security Detective lab
  const isSecurityDetectiveLab = content.title === "Security Detective: CIA Triad in Action";
  
  // Check if this is a Firewall Simulator lab
  const isFirewallSimulatorLab = content.title === "Firewall Rule Configuration Simulator";
  
  // Check if this is a SQL Injection lab
  const isSQLInjectionLab = content.title === "SQL Injection Lab";
  
  // Check if this is a Cryptography & Hashing lab
  const isCryptoHashingLab = content.title === "Cryptography & Hashing Lab";
  
  // Check if this is an Authentication Bypass lab
  const isAuthBypassLab = content.title === "Authentication Bypass Lab";
  
  // Check if this is an Access Control Matrix lab
  const isAccessControlMatrixLab = content.title === "Access Control Matrix Simulation";
  
  // Check if this is a MFA Demo lab
  const isMFADemoLab = content.title === "Multi-Factor Authentication Demo";
  
  // Level 6-10 labs
  const isSocialEngineeringLab = content.title === "Social Engineering Lab";
  const isMalwareAnalysisLab = content.title === "Malware Analysis Lab";
  const isDigitalForensicsLab = content.title === "Digital Forensics Lab";
  const isIncidentResponseLab = content.title === "Incident Response Lab";
  const isAPTLab = content.title === "Advanced Persistent Threats Lab";
  
  // If this is a Security Detective lab, render the specialized component
  if (isSecurityDetectiveLab) {
    return (
      <SecurityDetectiveLab 
        activity={activity}
        userId={userId}
        progress={progress}
      />
    );
  }
  
  // If this is a Firewall Simulator lab, render the specialized component
  if (isFirewallSimulatorLab) {
    return (
      <FirewallSimulatorLab
        activity={activity}
        userId={userId}
        progress={progress}
      />
    );
  }
  
  // If this is a SQL Injection lab, render the specialized component
  if (isSQLInjectionLab) {
    return (
      <SQLInjectionLab
        activity={activity}
        userId={userId}
        progress={progress}
      />
    );
  }
  
  // If this is a Cryptography & Hashing lab, render the specialized component
  if (isCryptoHashingLab) {
    return (
      <CryptoHashingLab
        activity={activity}
        userId={userId}
        progress={progress}
      />
    );
  }
  
  // If this is an Authentication Bypass lab, render the specialized component
  if (isAuthBypassLab) {
    return (
      <AuthBypassLab
        activity={activity}
        userId={userId}
        progress={progress}
      />
    );
  }
  
  // If this is an Access Control Matrix lab, render the specialized component
  if (isAccessControlMatrixLab) {
    return (
      <AccessControlMatrixLab
        activity={activity}
        userId={userId}
        progress={progress}
      />
    );
  }
  
  // If this is a MFA Demo lab, render the specialized component
  if (isMFADemoLab) {
    return (
      <MFADemoLab
        activity={activity}
        userId={userId}
        progress={progress}
      />
    );
  }
  
  // Level 6-10 labs
  if (isSocialEngineeringLab) {
    return (
      <SocialEngineeringLab
        activity={activity}
        userId={userId}
        progress={progress}
      />
    );
  }
  
  if (isMalwareAnalysisLab) {
    return (
      <MalwareAnalysisLab
        activity={activity}
        userId={userId}
        progress={progress}
      />
    );
  }
  
  if (isDigitalForensicsLab) {
    return (
      <DigitalForensicsLab
        activity={activity}
        userId={userId}
        progress={progress}
      />
    );
  }
  
  if (isIncidentResponseLab) {
    return (
      <IncidentResponseLab
        activity={activity}
        userId={userId}
        progress={progress}
      />
    );
  }
  
  if (isAPTLab) {
    return (
      <APTLab
        activity={activity}
        userId={userId}
        progress={progress}
      />
    );
  }
  
  // For standard labs, continue with existing implementation
  const currentTask = content.tasks[currentTaskIndex];
  
  const handleAnswerChange = (taskId: string, value: string) => {
    setAnswers({
      ...answers,
      [taskId]: value
    });
  };
  
  const toggleHint = (taskId: string) => {
    setShowHints({
      ...showHints,
      [taskId]: !showHints[taskId]
    });
  };
  
  const toggleSolution = (taskId: string) => {
    setShowSolutions({
      ...showSolutions,
      [taskId]: !showSolutions[taskId]
    });
  };
  
  const handleNextTask = () => {
    if (currentTaskIndex < content.tasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
    }
  };
  
  const handlePreviousTask = () => {
    if (currentTaskIndex > 0) {
      setCurrentTaskIndex(currentTaskIndex - 1);
    }
  };
  
  const handleSubmitLab = async () => {
    try {
      setIsSubmitting(true);
      
      console.log("Submitting lab activity:", activity.id);
      
      // Ensure activity ID is valid
      if (!activity.id) {
        throw new Error("Missing activity ID");
      }
      
      const payload = {
        isCompleted: true,
        answers,
        score: 100, // For labs, simply completing is enough
      };
      
      console.log("Sending payload:", payload);
      
      // Update activity progress in the database
      const response = await fetch(`/api/activities/${activity.id}/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        // Try to get error details
        let errorMessage = `${response.status} ${response.statusText}`;
        try {
          const errorText = await response.text();
          console.error("Error response:", errorText);
          errorMessage = errorText || errorMessage;
        } catch (e) {
          console.error("Could not read error response", e);
        }
        
        throw new Error(`Failed to update progress: ${errorMessage}`);
      }
      
      // Get the response data
      const data = await response.json();
      console.log("Success response:", data);
      
      setIsCompleted(true);
      
      // Force reload the page rather than just refreshing React data
      window.location.reload();
    } catch (error) {
      console.error("Error submitting lab:", error);
      alert("Failed to save your progress. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // If already completed, show the completed state
  if (isCompleted) {
    return (
      <div className="text-center py-6">
        <div className="mb-4">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-white">Lab Completed</h2>
        <p className="text-white mb-6">You've successfully completed this lab activity.</p>
        
        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={() => setIsCompleted(false)}>
            Review Lab
          </Button>
          <Button asChild>
            <a href={`/levels/${activity.levelId}`}>
              Return to Level
            </a>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="instructions" className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="instructions">Instructions</TabsTrigger>
          <TabsTrigger value="setup">Setup Guide</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>
        
        <TabsContent value="instructions" className="space-y-4">
          <div className="prose prose-invert max-w-none mb-6 text-white">
            <h2 className="text-2xl font-bold text-white">{content.title}</h2>
            <p className="text-white">{content.description}</p>
            <div className="text-white" dangerouslySetInnerHTML={{ __html: content.instructions }} />
          </div>
        </TabsContent>
        
        <TabsContent value="setup" className="space-y-4">
          <Card className="bg-black/30 border-blue-500/20">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Terminal className="h-5 w-5 mr-2" />
                Setup Guide
              </CardTitle>
              <CardDescription className="text-white/85">
                Follow these instructions to set up your environment for this lab
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none text-white">
                <div className="text-white" dangerouslySetInnerHTML={{ __html: content.setupGuide }} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="resources" className="space-y-4">
          <Card className="bg-black/30 border-blue-500/20">
            <CardHeader>
              <CardTitle className="text-white">Helpful Resources</CardTitle>
              <CardDescription className="text-white/85">
                External resources that may help with this lab
              </CardDescription>
            </CardHeader>
            <CardContent>
              {content.resources && content.resources.length > 0 ? (
                <ul className="space-y-2">
                  {content.resources.map((resource, index) => (
                    <li key={`${resource.name}-${index}`} className="flex items-center">
                      <ExternalLink className="h-4 w-4 mr-2 text-blue-400" />
                      <a 
                        href={resource.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        {resource.name}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-white/85">No external resources are provided for this lab.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Current Task */}
      <div className="border border-gray-800 rounded-lg p-6 bg-black/20">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">
            Task {currentTaskIndex + 1} of {content.tasks.length}
          </h3>
          
          <div className="flex space-x-2">
            {currentTask.hint && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => toggleHint(currentTask.id)}
              >
                {showHints[currentTask.id] ? "Hide Hint" : "Show Hint"}
              </Button>
            )}
            
            {currentTask.solution && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => toggleSolution(currentTask.id)}
              >
                {showSolutions[currentTask.id] ? "Hide Solution" : "Show Solution"}
              </Button>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="prose prose-invert max-w-none text-white">
            <div className="text-white" dangerouslySetInnerHTML={{ __html: currentTask.description }} />
          </div>
          
          {showHints[currentTask.id] && currentTask.hint && (
            <Card className="bg-yellow-950/20 border-yellow-500/30">
              <CardHeader className="py-3">
                <CardTitle className="text-sm text-white">Hint</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-yellow-300">{currentTask.hint}</p>
              </CardContent>
            </Card>
          )}
          
          {showSolutions[currentTask.id] && currentTask.solution && (
            <Card className="bg-green-950/20 border-green-500/30">
              <CardHeader className="py-3">
                <CardTitle className="text-sm text-white">Solution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert max-w-none text-white">
                  <div className="text-white" dangerouslySetInnerHTML={{ __html: currentTask.solution }} />
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="space-y-2">
            <label className="text-sm text-white">Your Answer/Notes:</label>
            <Textarea
              value={answers[currentTask.id] || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleAnswerChange(currentTask.id, e.target.value)}
              placeholder="Enter your answer or notes here..."
              className="min-h-[120px]"
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-between pt-4">
        <Button 
          variant="outline" 
          onClick={handlePreviousTask}
          disabled={currentTaskIndex === 0}
        >
          Previous Task
        </Button>
        
        {currentTaskIndex === content.tasks.length - 1 ? (
          <Button 
            onClick={handleSubmitLab}
            disabled={isSubmitting || Object.keys(answers).length < content.tasks.length}
          >
            {isSubmitting ? "Completing..." : "Complete Lab"}
          </Button>
        ) : (
          <Button 
            onClick={handleNextTask}
            disabled={!answers[currentTask?.id]}
          >
            Next Task
          </Button>
        )}
      </div>
    </div>
  );
} 