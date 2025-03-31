"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CheckCircle, AlertTriangle, ShieldAlert, Files, Server, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface IncidentResponseLabProps {
  activity: any;
  userId: string;
  progress: any;
}

interface LogEntry {
  id: string;
  timestamp: string;
  source: string;
  level: "info" | "warning" | "error" | "critical";
  message: string;
  relevance?: boolean;
}

interface Playbook {
  id: string;
  name: string;
  steps: {
    id: string;
    action: string;
    order: number;
  }[];
  correctOrder: string[];
}

export default function IncidentResponseLab({ activity, userId, progress }: IncidentResponseLabProps) {
  const router = useRouter();
  const [isCompleted, setIsCompleted] = useState(progress?.isCompleted || false);
  const [activeTab, setActiveTab] = useState("logs");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState<Record<string, boolean>>({});
  const [playbookSteps, setPlaybookSteps] = useState<Record<string, string[]>>({});
  const [containmentActions, setContainmentActions] = useState<Record<string, string>>({});
  const [showSolutions, setShowSolutions] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  // Parse content
  const content = typeof activity.content === 'string'
    ? JSON.parse(activity.content)
    : activity.content;

  const logs: LogEntry[] = content.logs || [];
  const playbooks: Playbook[] = content.playbooks || [];
  const containmentScenarios = content.containmentScenarios || [];

  const handleToggleSolution = (id: string) => {
    setShowSolutions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleLogSelection = (logId: string, selected: boolean) => {
    setSelectedLogs(prev => ({
      ...prev,
      [logId]: selected
    }));
  };

  const handleContainmentAction = (scenarioId: string, action: string) => {
    setContainmentActions(prev => ({
      ...prev,
      [scenarioId]: action
    }));
  };

  const handlePlaybookStepChange = (playbookId: string, stepOrder: string[]) => {
    setPlaybookSteps(prev => ({
      ...prev,
      [playbookId]: stepOrder
    }));
  };

  const calculateScore = () => {
    let total = 0;
    let earned = 0;

    // Log analysis (40% of total)
    const logWeight = 0.4;
    const relevantLogs = logs.filter(log => log.relevance);
    const relevantLogIds = new Set(relevantLogs.map(log => log.id));
    
    // Points for correctly selected logs
    Object.entries(selectedLogs).forEach(([logId, selected]) => {
      if (selected && relevantLogIds.has(logId)) {
        earned += 1;
      } else if (selected && !relevantLogIds.has(logId)) {
        earned -= 0.5; // Penalty for incorrectly selected logs
      }
    });

    // Normalize score to be between 0 and relevantLogs.length
    earned = Math.max(0, earned);
    const logScore = relevantLogs.length > 0 
      ? (earned / relevantLogs.length) * logWeight * 100 
      : 0;

    // Playbook ordering (30% of total)
    const playbookWeight = 0.3;
    let playbookScore = 0;
    let totalPlaybooks = playbooks.length;
    
    if (totalPlaybooks > 0) {
      let playbookPoints = 0;
      
      playbooks.forEach(playbook => {
        const userStepOrder = playbookSteps[playbook.id] || [];
        const correctOrder = playbook.correctOrder;
        
        // Count how many steps are in the correct position
        let correctPositions = 0;
        userStepOrder.forEach((stepId, index) => {
          if (index < correctOrder.length && stepId === correctOrder[index]) {
            correctPositions++;
          }
        });
        
        playbookPoints += correctOrder.length > 0 
          ? correctPositions / correctOrder.length 
          : 0;
      });
      
      playbookScore = (playbookPoints / totalPlaybooks) * playbookWeight * 100;
    }

    // Containment actions (30% of total)
    const containmentWeight = 0.3;
    let containmentScore = 0;
    
    if (containmentScenarios.length > 0) {
      let correctContainments = 0;
      
      containmentScenarios.forEach(scenario => {
        if (containmentActions[scenario.id] === scenario.correctAction) {
          correctContainments++;
        }
      });
      
      containmentScore = (correctContainments / containmentScenarios.length) * containmentWeight * 100;
    }

    // Total score
    const totalScore = Math.round(logScore + playbookScore + containmentScore);

    return {
      totalScore,
      logScore: Math.round(logScore / logWeight),
      playbookScore: Math.round(playbookScore / playbookWeight),
      containmentScore: Math.round(containmentScore / containmentWeight)
    };
  };

  const handleSubmitLab = async () => {
    try {
      setIsSubmitting(true);

      const scoreResults = calculateScore();
      setScore(scoreResults.totalScore);

      // Success threshold (70%)
      const passed = scoreResults.totalScore >= 70;

      // Prepare answers for submission
      const submissionData = {
        selectedLogs,
        playbookSteps,
        containmentActions
      };

      // Calculate points earned based on score percentage and total possible points
      const pointsEarned = Math.round((scoreResults.totalScore / 100) * activity.points);

      const payload = {
        isCompleted: passed,
        score: scoreResults.totalScore,
        pointsEarned,
        answers: submissionData
      };

      // Update activity progress in the database
      const response = await fetch(`/api/activities/${activity.id}/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to update progress");
      }

      setIsCompleted(passed);
      setShowResults(true);

      // Refresh the page data
      router.refresh();
    } catch (error) {
      console.error("Error submitting lab:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render results view
  if (showResults) {
    const scoreResults = calculateScore();
    
    return (
      <div className="space-y-6">
        <div className="text-center p-4">
          <div className="mb-4">
            {scoreResults.totalScore >= 70 ? (
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            ) : (
              <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto" />
            )}
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Lab Results</h2>
          <p className="text-gray-400 mb-4">
            {scoreResults.totalScore >= 70 
              ? "Congratulations! You've successfully completed the Incident Response Lab." 
              : "You need a score of at least 70% to pass this lab. Review the material and try again."}
          </p>
          
          <div className="text-2xl font-bold mb-6">
            Total Score: {scoreResults.totalScore}%
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <Card className="bg-black/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Log Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{scoreResults.logScore}%</div>
              </CardContent>
            </Card>
            
            <Card className="bg-black/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Playbook Ordering</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{scoreResults.playbookScore}%</div>
              </CardContent>
            </Card>
            
            <Card className="bg-black/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Containment Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{scoreResults.containmentScore}%</div>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-center space-x-4 mt-8">
            <Button onClick={() => setShowResults(false)} variant="outline">
              Review Exercises
            </Button>
            <Button asChild>
              <a href={`/levels/${activity.levelId}`}>
                Return to Level
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // If already completed and not showing results, show the completed state
  if (isCompleted && !showResults) {
    return (
      <div className="text-center py-6">
        <div className="mb-4">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Lab Completed</h2>
        <p className="text-gray-400 mb-6">You've successfully completed this lab.</p>
        
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{content.title || "Incident Response Lab"}</h2>
        <p className="text-gray-400 mt-1">{content.description || "Practice incident response procedures and decision-making."}</p>
      </div>

      <Tabs defaultValue="logs" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Files className="h-4 w-4" /> Log Analysis
          </TabsTrigger>
          <TabsTrigger value="containment" className="flex items-center gap-2">
            <Lock className="h-4 w-4" /> Breach Containment
          </TabsTrigger>
          <TabsTrigger value="playbook" className="flex items-center gap-2">
            <Server className="h-4 w-4" /> IR Playbook
          </TabsTrigger>
        </TabsList>

        {/* Log Analysis Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card className="bg-black/30">
            <CardHeader>
              <CardTitle>Log Analysis</CardTitle>
              <CardDescription>
                Analyze system logs to identify signs of a security breach.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 space-y-4">
                <p className="mb-4">Review the following logs and select entries that indicate suspicious activity.</p>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Select</TableHead>
                      <TableHead className="w-48">Timestamp</TableHead>
                      <TableHead className="w-32">Source</TableHead>
                      <TableHead className="w-24">Level</TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={!!selectedLogs[log.id]}
                            onChange={(e) => handleLogSelection(log.id, e.target.checked)}
                            className="w-4 h-4"
                          />
                        </TableCell>
                        <TableCell>{log.timestamp}</TableCell>
                        <TableCell>{log.source}</TableCell>
                        <TableCell>
                          <Badge variant={
                            log.level === "critical" ? "destructive" : 
                            log.level === "error" ? "destructive" : 
                            log.level === "warning" ? "default" : "outline"
                          }>
                            {log.level}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{log.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <Button 
                  variant="link" 
                  onClick={() => handleToggleSolution("logs")}
                  className="p-0 h-auto font-normal text-blue-400"
                >
                  {showSolutions["logs"] ? "Hide Solution" : "Show Solution"}
                </Button>
                
                {showSolutions["logs"] && (
                  <div className="mt-2 p-4 bg-black/40 rounded-md">
                    <h3 className="font-medium text-lg mb-2">Log Analysis Solution</h3>
                    <p className="mb-2">The following log entries indicate suspicious activity:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {logs.filter(log => log.relevance).map(log => (
                        <li key={log.id} className="text-sm">
                          <span className="font-medium">{log.timestamp}</span> - {log.message}
                          <p className="text-xs text-gray-400 mt-1">
                            This is suspicious because it shows signs of unauthorized access or unusual activity.
                          </p>
                        </li>
                      ))}
                    </ul>
                    
                    <p className="mt-4 mb-2 font-medium">Analysis tips:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Look for failed login attempts followed by successful ones (potential brute force)</li>
                      <li>Identify unusual access times or locations</li>
                      <li>Check for privilege escalation activities</li>
                      <li>Monitor for data exfiltration patterns</li>
                      <li>Watch for unusual process executions or service creations</li>
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Containment Tab */}
        <TabsContent value="containment" className="space-y-6">
          <Card className="bg-black/30">
            <CardHeader>
              <CardTitle>Breach Containment</CardTitle>
              <CardDescription>
                Select the appropriate containment strategies for each scenario.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {containmentScenarios.map((scenario) => (
                  <div key={scenario.id} className="p-4 bg-black/20 rounded-md">
                    <h3 className="text-lg font-medium mb-2">{scenario.title}</h3>
                    <p className="mb-4">{scenario.description}</p>
                    
                    <RadioGroup
                      value={containmentActions[scenario.id] || ""}
                      onValueChange={(value) => handleContainmentAction(scenario.id, value)}
                    >
                      {scenario.actions.map((action) => (
                        <div key={action.id} className="flex items-start space-x-2 mt-3">
                          <RadioGroupItem id={`action-${scenario.id}-${action.id}`} value={action.id} />
                          <div>
                            <Label htmlFor={`action-${scenario.id}-${action.id}`} className="font-medium">
                              {action.name}
                            </Label>
                            <p className="text-sm text-gray-400">{action.description}</p>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                    
                    <Button 
                      variant="link" 
                      onClick={() => handleToggleSolution(scenario.id)}
                      className="p-0 h-auto font-normal text-blue-400 mt-4"
                    >
                      {showSolutions[scenario.id] ? "Hide Solution" : "Show Solution"}
                    </Button>
                    
                    {showSolutions[scenario.id] && (
                      <div className="mt-2 p-4 bg-black/40 rounded-md">
                        <h4 className="font-medium mb-2">Correct Containment Approach:</h4>
                        <p>{scenario.solution}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Playbook Tab */}
        <TabsContent value="playbook" className="space-y-6">
          <Card className="bg-black/30">
            <CardHeader>
              <CardTitle>IR Playbook Development</CardTitle>
              <CardDescription>
                Arrange the steps in correct order to create effective incident response playbooks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {playbooks.map((playbook) => (
                  <div key={playbook.id} className="p-4 bg-black/20 rounded-md">
                    <h3 className="text-lg font-medium mb-2">{playbook.name}</h3>
                    <p className="mb-4">Arrange these incident response steps in the correct order:</p>
                    
                    <div className="space-y-2">
                      {playbook.steps.map((step) => (
                        <div key={step.id} className="flex items-center p-2 bg-black/20 rounded border border-gray-700">
                          <span className="mr-2 text-sm">{step.order}.</span>
                          <p>{step.action}</p>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      variant="link" 
                      onClick={() => handleToggleSolution(playbook.id)}
                      className="p-0 h-auto font-normal text-blue-400 mt-4"
                    >
                      {showSolutions[playbook.id] ? "Hide Solution" : "Show Solution"}
                    </Button>
                    
                    {showSolutions[playbook.id] && (
                      <div className="mt-2 p-4 bg-black/40 rounded-md">
                        <h4 className="font-medium mb-2">Correct Playbook Order:</h4>
                        <ol className="list-decimal pl-5 space-y-1">
                          {playbook.correctOrder.map((stepId) => {
                            const step = playbook.steps.find(s => s.id === stepId);
                            return step ? (
                              <li key={stepId}>{step.action}</li>
                            ) : null;
                          })}
                        </ol>
                        
                        <p className="mt-4 text-sm">
                          Following this sequence ensures a structured response with proper evidence preservation,
                          effective containment, thorough eradication, and complete recovery while maintaining
                          proper documentation.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-center mt-8">
        <Button onClick={handleSubmitLab} disabled={isSubmitting} className="w-full md:w-auto">
          {isSubmitting ? "Submitting..." : "Submit Analysis"}
        </Button>
      </div>
    </div>
  );
} 