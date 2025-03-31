import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Check, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface OfficeObject {
  id: string;
  name: string;
  type: 'computer' | 'document' | 'door' | 'cabinet' | 'printer' | 'window';
  position: { x: number; y: number };
  securityIssues: SecurityIssue[];
  isInteractable: boolean;
  image: string;
}

interface SecurityIssue {
  id: string;
  type: 'confidentiality' | 'integrity' | 'availability';
  description: string;
  impact: string;
  solution: string;
  isFixed: boolean;
}

interface SecurityDetectiveLabProps {
  activity: any;
  userId: string;
  progress: any;
}

export default function SecurityDetectiveLab({ activity, userId, progress }: SecurityDetectiveLabProps) {
  const router = useRouter();
  const [isCompleted, setIsCompleted] = useState(progress?.isCompleted || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("instructions");
  const [selectedObject, setSelectedObject] = useState<OfficeObject | null>(null);
  const [securityScore, setSecurityScore] = useState(0);
  const [issuesFixed, setIssuesFixed] = useState(0);
  const [totalIssues, setTotalIssues] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [inventory, setInventory] = useState<string[]>([]);
  
  // Parse content
  const content = typeof activity.content === 'string'
    ? JSON.parse(activity.content)
    : activity.content;
  
  // Initialize office objects with security issues
  const [officeObjects, setOfficeObjects] = useState<OfficeObject[]>([
    {
      id: "computer1",
      name: "Employee Workstation",
      type: "computer",
      position: { x: 100, y: 100 },
      image: "/images/labs/level1/computer.svg",
      isInteractable: true,
      securityIssues: [
        {
          id: "issue1",
          type: "confidentiality",
          description: "Computer is left unlocked with sensitive data visible",
          impact: "Unauthorized access to sensitive information",
          solution: "Implement automatic screen locking after inactivity",
          isFixed: false
        }
      ]
    },
    {
      id: "document1",
      name: "Confidential Report",
      type: "document",
      position: { x: 200, y: 150 },
      image: "/images/labs/level1/document.svg",
      isInteractable: true,
      securityIssues: [
        {
          id: "issue2",
          type: "integrity",
          description: "Document is not properly secured and can be modified",
          impact: "Unauthorized modifications to sensitive data",
          solution: "Implement document version control and access restrictions",
          isFixed: false
        }
      ]
    },
    {
      id: "cabinet1",
      name: "Filing Cabinet",
      type: "cabinet",
      position: { x: 300, y: 200 },
      image: "/images/labs/level1/cabinet.svg",
      isInteractable: true,
      securityIssues: [
        {
          id: "issue3",
          type: "confidentiality",
          description: "Physical documents are not properly secured",
          impact: "Unauthorized physical access to sensitive documents",
          solution: "Implement physical security controls and access logs",
          isFixed: false
        }
      ]
    },
    {
      id: "printer1",
      name: "Network Printer",
      type: "printer",
      position: { x: 400, y: 250 },
      image: "/images/labs/level1/printer.svg",
      isInteractable: true,
      securityIssues: [
        {
          id: "issue4",
          type: "availability",
          description: "Printer lacks proper security controls",
          impact: "Potential for denial of service attacks",
          solution: "Implement printer access controls and monitoring",
          isFixed: false
        }
      ]
    }
  ]);

  useEffect(() => {
    // Calculate total issues
    const total = officeObjects.reduce((sum, obj) => sum + obj.securityIssues.length, 0);
    setTotalIssues(total);

    // Load progress if available
    if (progress?.answers) {
      try {
        const savedAnswers = typeof progress.answers === 'string'
          ? JSON.parse(progress.answers)
          : progress.answers;
        
        if (savedAnswers.fixedIssues) {
          const updatedObjects = officeObjects.map(obj => ({
            ...obj,
            securityIssues: obj.securityIssues.map(issue => ({
              ...issue,
              isFixed: savedAnswers.fixedIssues.includes(issue.id)
            }))
          }));
          setOfficeObjects(updatedObjects);
          
          // Update issues fixed count
          const fixed = updatedObjects.reduce((sum, obj) => 
            sum + obj.securityIssues.filter(issue => issue.isFixed).length, 0);
          setIssuesFixed(fixed);
        }
      } catch (error) {
        console.error("Error parsing saved answers:", error);
      }
    }
  }, [progress]);

  const handleObjectClick = (object: OfficeObject) => {
    setSelectedObject(object);
    setShowSolution(false);
  };

  const handleFixIssue = (issueId: string) => {
    const updatedObjects = officeObjects.map(obj => ({
      ...obj,
      securityIssues: obj.securityIssues.map(issue => 
        issue.id === issueId ? { ...issue, isFixed: true } : issue
      )
    }));
    
    setOfficeObjects(updatedObjects);
    
    // Update issues fixed count
    const fixed = updatedObjects.reduce((sum, obj) => 
      sum + obj.securityIssues.filter(issue => issue.isFixed).length, 0);
    setIssuesFixed(fixed);
    
    // Calculate security score
    const score = Math.round((fixed / totalIssues) * 100);
    setSecurityScore(score);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Prepare answers object to save
      const fixedIssues = officeObjects.flatMap(obj => 
        obj.securityIssues.filter(issue => issue.isFixed).map(issue => issue.id)
      );
      
      const answersToSave = {
        fixedIssues,
        securityScore
      };
      
      // Update activity progress in the database
      const response = await fetch(`/api/activities/${activity.id}/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isCompleted: true,
          score: securityScore,
          pointsEarned: Math.round((securityScore / 100) * activity.points),
          answers: answersToSave
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update progress");
      }
      
      setIsCompleted(true);
      router.refresh();
    } catch (error) {
      console.error("Error submitting lab:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If already completed, show the completion summary
  if (isCompleted) {
    return (
      <div className="text-center py-6 space-y-6">
        <div className="mb-4">
          <Check className="h-16 w-16 text-green-500 mx-auto" />
        </div>
        
        <h2 className="text-2xl font-bold mb-2 text-white">Investigation Complete!</h2>
        <p className="text-white mb-4">You've successfully completed the Security Detective lab.</p>
        
        <div className="max-w-md mx-auto bg-black/30 p-4 rounded-lg border border-green-500/20 mb-6">
          <h3 className="text-lg font-semibold mb-2 text-white">Your Security Score</h3>
          <div className="relative h-6 w-full bg-gray-800 rounded-full mb-2">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
              style={{ width: `${securityScore}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-sm font-medium text-white">
              {securityScore}%
            </span>
          </div>
          <p className="text-sm text-gray-400">Fixed {issuesFixed} of {totalIssues} security issues</p>
        </div>
        
        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={() => setIsCompleted(false)}>
            Review Investigation
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
      <Tabs defaultValue="instructions" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="instructions">Instructions</TabsTrigger>
          <TabsTrigger value="lab">Lab Environment</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>
        
        <TabsContent value="instructions" className="space-y-4">
          <div className="prose prose-invert max-w-none mb-6 text-white">
            <h2 className="text-2xl font-bold text-white">Security Detective: CIA Triad in Action</h2>
            <p className="text-white">
              Welcome to the Security Detective lab! In this interactive simulation, you'll explore a virtual office environment
              to identify and fix security issues related to the CIA triad (Confidentiality, Integrity, and Availability).
            </p>
            <h3 className="text-xl font-semibold text-white mt-4">Objectives</h3>
            <ul className="list-disc pl-5 text-white">
              <li>Explore the virtual office environment to identify security issues</li>
              <li>Classify security issues according to the CIA triad</li>
              <li>Implement appropriate security controls to fix the issues</li>
              <li>Understand the impact of security decisions on the organization</li>
            </ul>
            <p className="text-white mt-4">
              Click on different objects in the office to investigate security issues. For each issue you find:
            </p>
            <ol className="list-decimal pl-5 text-white">
              <li>Identify the type of security issue (Confidentiality, Integrity, or Availability)</li>
              <li>Understand the potential impact of the issue</li>
              <li>Choose and implement an appropriate solution</li>
              <li>Verify that the security control is effective</li>
            </ol>
          </div>
        </TabsContent>
        
        <TabsContent value="lab" className="space-y-4">
          <div className="relative h-[600px] bg-black/30 rounded-lg border border-blue-500/20 overflow-hidden">
            {/* Office Environment */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800">
              {officeObjects.map((obj) => (
                <div
                  key={obj.id}
                  className="absolute cursor-pointer transition-transform hover:scale-105"
                  style={{ left: obj.position.x, top: obj.position.y }}
                  onClick={() => handleObjectClick(obj)}
                >
                  <div className="relative w-24 h-24">
                    <Image
                      src={obj.image}
                      alt={obj.name}
                      fill
                      style={{ objectFit: 'contain' }}
                    />
                    {obj.securityIssues.some(issue => !issue.isFixed) && (
                      <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Selected Object Details */}
            {selectedObject && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                <Card className="w-[600px] bg-black/30 border-blue-500/20">
                  <CardHeader>
                    <CardTitle className="text-xl text-white">{selectedObject.name}</CardTitle>
                    <CardDescription className="text-gray-300">
                      {selectedObject.type.charAt(0).toUpperCase() + selectedObject.type.slice(1)}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {selectedObject.securityIssues.map((issue) => (
                      <div
                        key={issue.id}
                        className={`p-4 rounded-lg border ${
                          issue.isFixed
                            ? "bg-green-900/30 border-green-500"
                            : "bg-red-900/30 border-red-500"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-white font-medium">
                            {issue.type.charAt(0).toUpperCase() + issue.type.slice(1)} Issue
                          </h4>
                          {issue.isFixed ? (
                            <Check className="h-4 w-4 text-green-400" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-400" />
                          )}
                        </div>
                        
                        <p className="text-gray-300 mb-2">{issue.description}</p>
                        
                        <div className="bg-black/30 p-3 rounded-md mb-2">
                          <p className="text-sm text-gray-400">Impact:</p>
                          <p className="text-white">{issue.impact}</p>
                        </div>
                        
                        {!issue.isFixed && (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-400">Solution:</p>
                            <p className="text-white">{issue.solution}</p>
                            <Button
                              size="sm"
                              onClick={() => handleFixIssue(issue.id)}
                              className="mt-2"
                            >
                              Implement Solution
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                  
                  <CardFooter>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedObject(null)}
                    >
                      Close
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Security Issues Fixed</span>
              <span className="text-sm font-medium text-white">{issuesFixed} of {totalIssues}</span>
            </div>
            <Progress value={(issuesFixed / totalIssues) * 100} className="h-2" />
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-center mt-6">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || issuesFixed < totalIssues}
              className="px-6"
            >
              {isSubmitting ? "Submitting..." : "Complete Investigation"}
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resources</CardTitle>
              <CardDescription>Helpful information for the Security Detective lab</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-invert max-w-none">
                <h3>CIA Triad Overview</h3>
                <ul>
                  <li><strong>Confidentiality:</strong> Ensuring that information is only accessible to authorized users</li>
                  <li><strong>Integrity:</strong> Maintaining the accuracy and trustworthiness of data</li>
                  <li><strong>Availability:</strong> Ensuring that systems and data are accessible when needed</li>
                </ul>
                
                <h3>Common Security Controls</h3>
                <ul>
                  <li>Access controls and authentication</li>
                  <li>Encryption and data protection</li>
                  <li>Backup and recovery procedures</li>
                  <li>Physical security measures</li>
                  <li>Network security controls</li>
                </ul>
                
                <h3>Best Practices</h3>
                <ul>
                  <li>Implement the principle of least privilege</li>
                  <li>Regular security assessments</li>
                  <li>Employee security awareness training</li>
                  <li>Incident response planning</li>
                  <li>Regular updates and patches</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 