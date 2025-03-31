"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CheckCircle, Shield, Search, Sword, LucideTarget } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface APTLabProps {
  activity: any;
  userId: string;
  progress: any;
}

interface IoC {
  id: string;
  type: string;
  value: string;
  description: string;
  associated: boolean;
}

interface AttackStage {
  id: string;
  name: string;
  description: string;
  responses: Array<{
    id: string;
    text: string;
  }>;
  correctResponse: string;
  solution: string;
}

interface DefenseScenario {
  id: string;
  title: string;
  description: string;
  strategies: Array<{
    id: string;
    name: string;
    description: string;
    justification?: string;
  }>;
  recommendedStrategies: string[];
}

export default function APTLab({ activity, userId, progress }: APTLabProps) {
  const router = useRouter();
  const [isCompleted, setIsCompleted] = useState(progress?.isCompleted || false);
  const [activeTab, setActiveTab] = useState("indicators");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIoCs, setSelectedIoCs] = useState<Record<string, boolean>>({});
  const [attackStageResponses, setAttackStageResponses] = useState<Record<string, string>>({});
  const [defenseStrategies, setDefenseStrategies] = useState<Record<string, string[]>>({});
  const [showSolutions, setShowSolutions] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  // Parse content
  const content = typeof activity.content === 'string'
    ? JSON.parse(activity.content)
    : activity.content || {};

  const handleToggleSolution = (id: string) => {
    setShowSolutions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleIoCSelection = (iocId: string, selected: boolean) => {
    setSelectedIoCs(prev => ({
      ...prev,
      [iocId]: selected
    }));
  };

  const handleAttackStageResponse = (stageId: string, response: string) => {
    setAttackStageResponses(prev => ({
      ...prev,
      [stageId]: response
    }));
  };

  const handleDefenseStrategyChange = (scenarioId: string, strategies: string[]) => {
    setDefenseStrategies(prev => ({
      ...prev,
      [scenarioId]: strategies
    }));
  };

  const calculateScore = () => {
    let totalScore = 0;
    
    // IoC identification score - 30% of total
    const iocWeight = 0.3;
    const iocs = content.indicators || [];
    const associatedIoCs = iocs.filter((ioc: IoC) => ioc.associated);
    const associatedIoCIds = new Set(associatedIoCs.map((ioc: IoC) => ioc.id));
    
    let correctIoCs = 0;
    let incorrectIoCs = 0;
    
    Object.entries(selectedIoCs).forEach(([iocId, selected]) => {
      if (selected && associatedIoCIds.has(iocId)) {
        correctIoCs++;
      } else if (selected && !associatedIoCIds.has(iocId)) {
        incorrectIoCs++;
      }
    });
    
    const iocScore = associatedIoCs.length > 0 
      ? Math.max(0, (correctIoCs / associatedIoCs.length) - (incorrectIoCs * 0.2)) * iocWeight * 100 
      : 0;

    // Attack stage response score - 40% of total
    const stageWeight = 0.4;
    const stages = content.attackStages || [];
    let stageScore = 0;
    
    if (stages.length > 0) {
      let correctStages = 0;
      
      stages.forEach((stage: AttackStage) => {
        if (attackStageResponses[stage.id] === stage.correctResponse) {
          correctStages++;
        }
      });
      
      stageScore = (correctStages / stages.length) * stageWeight * 100;
    }

    // Defense strategies score - 30% of total
    const defenseWeight = 0.3;
    const scenarios = content.defenseScenarios || [];
    let defenseScore = 0;
    
    if (scenarios.length > 0) {
      let totalDefensePoints = 0;
      
      scenarios.forEach((scenario: DefenseScenario) => {
        const selectedStrategies = defenseStrategies[scenario.id] || [];
        const recommendedStrategies = new Set(scenario.recommendedStrategies);
        
        let scenarioPoints = 0;
        selectedStrategies.forEach(strategy => {
          if (recommendedStrategies.has(strategy)) {
            scenarioPoints += 1 / recommendedStrategies.size;
          } else {
            scenarioPoints -= 0.2; // Penalty for incorrect strategies
          }
        });
        
        totalDefensePoints += Math.max(0, scenarioPoints);
      });
      
      defenseScore = (totalDefensePoints / scenarios.length) * defenseWeight * 100;
    }

    // Calculate total score
    totalScore = Math.round(iocScore + stageScore + defenseScore);
    return Math.min(100, Math.max(0, totalScore));
  };

  const handleSubmitLab = async () => {
    try {
      setIsSubmitting(true);

      const scoreValue = calculateScore();
      setScore(scoreValue);

      // Success threshold (70%)
      const passed = scoreValue >= 70;

      // Prepare answers for submission
      const submissionData = {
        selectedIoCs,
        attackStageResponses,
        defenseStrategies
      };

      // Calculate points earned based on score percentage and total possible points
      const pointsEarned = Math.round((scoreValue / 100) * activity.points);

      const payload = {
        isCompleted: passed,
        score: scoreValue,
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
    return (
      <div className="space-y-6">
        <div className="text-center p-4">
          <div className="mb-4">
            {score >= 70 ? (
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            ) : (
              <Shield className="h-16 w-16 text-yellow-500 mx-auto" />
            )}
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Lab Results</h2>
          <p className="text-gray-400 mb-4">
            {score >= 70 
              ? "Congratulations! You've successfully completed the APT Analysis Lab." 
              : "You need a score of at least 70% to pass this lab. Review the material and try again."}
          </p>
          
          <div className="text-2xl font-bold mb-6">
            Total Score: {score}%
          </div>
          
          <div className="flex justify-center space-x-4 mt-8">
            <Button onClick={() => setShowResults(false)} variant="outline">
              Review Analysis
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
        <h2 className="text-2xl font-bold">{content.title || "Advanced Persistent Threats Lab"}</h2>
        <p className="text-gray-400 mt-1">{content.description || "Analyze APT attack patterns and develop defense strategies."}</p>
      </div>

      <Tabs defaultValue="indicators" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="indicators" className="flex items-center gap-2">
            <Search className="h-4 w-4" /> Indicators of Compromise
          </TabsTrigger>
          <TabsTrigger value="attackStages" className="flex items-center gap-2">
            <Sword className="h-4 w-4" /> Attack Lifecycle
          </TabsTrigger>
          <TabsTrigger value="defenseStrategies" className="flex items-center gap-2">
            <Shield className="h-4 w-4" /> Defense Strategies
          </TabsTrigger>
        </TabsList>

        {/* Indicators of Compromise Tab */}
        <TabsContent value="indicators" className="space-y-6">
          <Card className="bg-black/30">
            <CardHeader>
              <CardTitle>Indicators of Compromise (IoCs)</CardTitle>
              <CardDescription>
                Review the following indicators and select those associated with the APT campaign.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="mb-4">The following indicators were found during investigation of a potential breach. Select all indicators you believe are associated with the APT campaign described in the scenario.</p>
                
                <div className="rounded-md bg-black/20 p-4 mb-4">
                  <h3 className="font-medium text-lg mb-2">Scenario: Dragonfly APT Campaign</h3>
                  <p>An energy sector organization has detected unusual network traffic to external domains and suspects they may be targeted by the Dragonfly APT group. The security team has collected various indicators from the network and endpoints.</p>
                </div>
                
                <div className="grid gap-4">
                  {(content.indicators || []).map((ioc: IoC) => (
                    <div key={ioc.id} className="flex items-start space-x-3 p-3 rounded-md bg-black/10 hover:bg-black/20">
                      <Checkbox 
                        id={`ioc-${ioc.id}`}
                        checked={!!selectedIoCs[ioc.id]} 
                        onCheckedChange={(checked: boolean | "indeterminate") => handleIoCSelection(ioc.id, checked === true)}
                      />
                      <div>
                        <Label htmlFor={`ioc-${ioc.id}`} className="font-medium">{ioc.type}: {ioc.value}</Label>
                        <p className="text-sm text-gray-400">{ioc.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button 
                  variant="link" 
                  onClick={() => handleToggleSolution("indicators")}
                  className="p-0 h-auto font-normal text-blue-400 mt-4"
                >
                  {showSolutions["indicators"] ? "Hide Solution" : "Show Solution"}
                </Button>
                
                {showSolutions["indicators"] && (
                  <div className="mt-2 p-4 bg-black/40 rounded-md">
                    <h3 className="font-medium text-lg mb-2">IoC Analysis Solution</h3>
                    <p className="mb-2">The following indicators are associated with the APT campaign:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {(content.indicators || [])
                        .filter((ioc: IoC) => ioc.associated)
                        .map((ioc: IoC) => (
                          <li key={ioc.id} className="text-sm">
                            <span className="font-medium">{ioc.type}: {ioc.value}</span>
                            <p className="text-xs text-gray-400 mt-1">
                              This is associated with the campaign because it matches known Dragonfly APT infrastructure or techniques.
                            </p>
                          </li>
                        ))
                      }
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attack Lifecycle Tab */}
        <TabsContent value="attackStages" className="space-y-6">
          <Card className="bg-black/30">
            <CardHeader>
              <CardTitle>APT Attack Lifecycle</CardTitle>
              <CardDescription>
                Analyze each stage of the APT attack and select the appropriate response.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {(content.attackStages || []).map((stage: AttackStage) => (
                  <div key={stage.id} className="p-4 bg-black/20 rounded-md">
                    <h3 className="text-lg font-medium mb-2">{stage.name}</h3>
                    <p className="mb-4">{stage.description}</p>
                    
                    <RadioGroup
                      value={attackStageResponses[stage.id] || ""}
                      onValueChange={(value) => handleAttackStageResponse(stage.id, value)}
                    >
                      {stage.responses.map((response) => (
                        <div key={response.id} className="flex items-start space-x-2 mt-3">
                          <RadioGroupItem id={`response-${stage.id}-${response.id}`} value={response.id} />
                          <div>
                            <Label htmlFor={`response-${stage.id}-${response.id}`} className="font-medium">
                              {response.text}
                            </Label>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                    
                    <Button 
                      variant="link" 
                      onClick={() => handleToggleSolution(stage.id)}
                      className="p-0 h-auto font-normal text-blue-400 mt-4"
                    >
                      {showSolutions[stage.id] ? "Hide Solution" : "Show Solution"}
                    </Button>
                    
                    {showSolutions[stage.id] && (
                      <div className="mt-2 p-4 bg-black/40 rounded-md">
                        <h4 className="font-medium mb-2">Correct Approach:</h4>
                        <p>{stage.solution}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Defense Strategies Tab */}
        <TabsContent value="defenseStrategies" className="space-y-6">
          <Card className="bg-black/30">
            <CardHeader>
              <CardTitle>Defense Strategy Development</CardTitle>
              <CardDescription>
                Develop defense strategies against APT campaigns for different scenarios.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {(content.defenseScenarios || []).map((scenario: DefenseScenario) => (
                  <div key={scenario.id} className="p-4 bg-black/20 rounded-md">
                    <h3 className="text-lg font-medium mb-2">{scenario.title}</h3>
                    <p className="mb-4">{scenario.description}</p>
                    
                    <h4 className="font-medium mb-2">Select appropriate defense strategies:</h4>
                    <div className="grid gap-2">
                      {scenario.strategies.map((strategy) => (
                        <div key={strategy.id} className="flex items-start space-x-3">
                          <Checkbox 
                            id={`strategy-${scenario.id}-${strategy.id}`}
                            checked={(defenseStrategies[scenario.id] || []).includes(strategy.id)} 
                            onCheckedChange={(checked: boolean | "indeterminate") => {
                              const currentStrategies = defenseStrategies[scenario.id] || [];
                              if (checked === true) {
                                handleDefenseStrategyChange(scenario.id, [...currentStrategies, strategy.id]);
                              } else {
                                handleDefenseStrategyChange(
                                  scenario.id, 
                                  currentStrategies.filter(id => id !== strategy.id)
                                );
                              }
                            }}
                          />
                          <div>
                            <Label htmlFor={`strategy-${scenario.id}-${strategy.id}`} className="font-medium">
                              {strategy.name}
                            </Label>
                            <p className="text-sm text-gray-400">{strategy.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      variant="link" 
                      onClick={() => handleToggleSolution(`defense-${scenario.id}`)}
                      className="p-0 h-auto font-normal text-blue-400 mt-4"
                    >
                      {showSolutions[`defense-${scenario.id}`] ? "Hide Solution" : "Show Solution"}
                    </Button>
                    
                    {showSolutions[`defense-${scenario.id}`] && (
                      <div className="mt-2 p-4 bg-black/40 rounded-md">
                        <h4 className="font-medium mb-2">Recommended Strategies:</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {scenario.strategies
                            .filter((strategy) => scenario.recommendedStrategies.includes(strategy.id))
                            .map((strategy) => (
                              <li key={strategy.id}>
                                <span className="font-medium">{strategy.name}</span>
                                <p className="text-sm text-gray-400">{strategy.justification || "This is an effective strategy for this scenario."}</p>
                              </li>
                            ))
                          }
                        </ul>
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