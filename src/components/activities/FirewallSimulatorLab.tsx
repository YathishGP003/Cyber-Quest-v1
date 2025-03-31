"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Check, X, AlertCircle, CheckCircle, Info, Shield, ShieldAlert, ArrowRight, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";

// Types for the lab structure
interface Packet {
  id: string;
  source_ip: string;
  destination_ip: string;
  protocol: string;
  source_port: number;
  destination_port: number;
  payload: string;
  is_malicious: boolean;
  description: string;
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  goal: string;
  traffic: Packet[];
  hint?: string;
  solution?: string;
}

interface FirewallRule {
  id: string;
  source_ip: string;
  destination_ip: string;
  protocol: string;
  port: string;
  action: "allow" | "deny";
}

interface FirewallLabContent {
  title: string;
  description: string;
  instructions: string;
  setupGuide: string;
  scenarios: Scenario[];
  resources?: {
    name: string;
    url: string;
  }[];
}

interface FirewallSimulatorLabProps {
  activity: any;
  userId: string;
  progress: any;
}

export default function FirewallSimulatorLab({ activity, userId, progress }: FirewallSimulatorLabProps) {
  const router = useRouter();
  const [isCompleted, setIsCompleted] = useState(progress?.isCompleted || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [rules, setRules] = useState<Record<string, FirewallRule[]>>({});
  const [newRule, setNewRule] = useState<Partial<FirewallRule>>({
    source_ip: "*",
    destination_ip: "*",
    protocol: "any",
    port: "*",
    action: "deny"
  });
  const [results, setResults] = useState<Record<string, {
    blocked: Packet[];
    allowed: Packet[];
    blockedMalicious: number;
    allowedBenign: number;
    score: number;
  }>>({});
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});
  const [showSolutions, setShowSolutions] = useState<Record<string, boolean>>({});
  const [scenariosCompleted, setScenariosCompleted] = useState(0);
  
  // Parse content
  const content: FirewallLabContent = typeof activity.content === 'string'
    ? JSON.parse(activity.content)
    : activity.content;
  
  const scenarios: Scenario[] = content.scenarios || [];
  const currentScenario = scenarios[currentScenarioIndex];
  
  // Load saved progress
  useEffect(() => {
    if (progress?.answers) {
      try {
        const savedAnswers = typeof progress.answers === 'string'
          ? JSON.parse(progress.answers)
          : progress.answers;
        
        if (savedAnswers.rules) {
          setRules(savedAnswers.rules);
        }
        
        if (savedAnswers.results) {
          setResults(savedAnswers.results);
        }
        
        // Calculate scenarios completed
        const completedCount = Object.keys(savedAnswers.results || {}).length;
        setScenariosCompleted(completedCount);
      } catch (error) {
        console.error("Error parsing saved answers:", error);
      }
    }
  }, [progress]);
  
  // Initialize rules for each scenario
  useEffect(() => {
    scenarios.forEach(scenario => {
      if (!rules[scenario.id]) {
        setRules(prev => ({
          ...prev,
          [scenario.id]: []
        }));
      }
    });
  }, [scenarios]);
  
  // Helper function to check if an IP matches a rule
  const ipMatches = (ip: string, rule: string): boolean => {
    if (rule === "*") return true;
    
    // Check for CIDR notation (e.g., 192.168.1.0/24)
    if (rule.includes("/")) {
      const [subnet, bits] = rule.split("/");
      const mask = parseInt(bits);
      
      // Convert IP addresses to binary for subnet comparison
      const ipBinary = ip.split(".").map(octet => 
        parseInt(octet).toString(2).padStart(8, "0")
      ).join("");
      
      const subnetBinary = subnet.split(".").map(octet => 
        parseInt(octet).toString(2).padStart(8, "0")
      ).join("");
      
      // Compare only the subnet portion
      return ipBinary.substring(0, mask) === subnetBinary.substring(0, mask);
    }
    
    return ip === rule;
  };
  
  // Helper function to check if a port matches a rule
  const portMatches = (port: number, rulePort: string): boolean => {
    if (rulePort === "*") return true;
    
    // Check for port range (e.g., 8000-9000)
    if (rulePort.includes("-")) {
      const [min, max] = rulePort.split("-").map(p => parseInt(p));
      return port >= min && port <= max;
    }
    
    return port === parseInt(rulePort);
  };
  
  // Check if a packet matches a rule
  const packetMatchesRule = (packet: Packet, rule: FirewallRule): boolean => {
    // Check source IP
    const sourceMatches = ipMatches(packet.source_ip, rule.source_ip);
    if (!sourceMatches) return false;
    
    // Check destination IP
    const destMatches = ipMatches(packet.destination_ip, rule.destination_ip);
    if (!destMatches) return false;
    
    // Check protocol
    const protocolMatches = rule.protocol === "any" || packet.protocol === rule.protocol;
    if (!protocolMatches) return false;
    
    // Check port
    const portMatches = rule.port === "*" || 
      portMatchesRule(packet.source_port, packet.destination_port, rule.port);
    if (!portMatches) return false;
    
    return true;
  };
  
  // Helper function to check if ports match a rule
  const portMatchesRule = (srcPort: number, dstPort: number, rulePort: string): boolean => {
    if (rulePort === "*") return true;
    
    // Try to match either source or destination port
    return portMatches(srcPort, rulePort) || portMatches(dstPort, rulePort);
  };
  
  // Apply firewall rules to traffic
  const applyRules = (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) return;
    
    const scenarioRules = rules[scenarioId] || [];
    const traffic = scenario.traffic;
    
    const blocked: Packet[] = [];
    const allowed: Packet[] = [];
    
    // Process each packet through the rules
    traffic.forEach(packet => {
      // If no rules, everything is allowed by default
      if (scenarioRules.length === 0) {
        allowed.push(packet);
        return;
      }
      
      // Check each rule in order (first match wins)
      let matched = false;
      
      for (const rule of scenarioRules) {
        if (packetMatchesRule(packet, rule)) {
          if (rule.action === "allow") {
            allowed.push(packet);
          } else {
            blocked.push(packet);
          }
          matched = true;
          break;
        }
      }
      
      // If no rules matched, allow by default
      if (!matched) {
        allowed.push(packet);
      }
    });
    
    // Count blocked malicious and allowed benign packets
    const blockedMalicious = blocked.filter(p => p.is_malicious).length;
    const allowedBenign = allowed.filter(p => !p.is_malicious).length;
    const totalMalicious = traffic.filter(p => p.is_malicious).length;
    const totalBenign = traffic.filter(p => !p.is_malicious).length;
    
    // Calculate score based on security effectiveness
    // Formula: (blocked_malicious/total_malicious * 0.7) + (allowed_benign/total_benign * 0.3) * 100
    const securityScore = Math.round(
      ((totalMalicious > 0 ? blockedMalicious / totalMalicious : 1) * 0.7 + 
       (totalBenign > 0 ? allowedBenign / totalBenign : 1) * 0.3) * 100
    );
    
    // Save results
    setResults(prev => ({
      ...prev,
      [scenarioId]: {
        blocked,
        allowed,
        blockedMalicious,
        allowedBenign,
        score: securityScore
      }
    }));
    
    // If this is a newly completed scenario, increment the count
    if (!results[scenarioId]) {
      setScenariosCompleted(prev => prev + 1);
    }
  };
  
  // Add a new rule to the current scenario
  const addRule = () => {
    if (!currentScenario) return;
    
    const ruleId = `rule-${Date.now()}`;
    const newRuleWithId: FirewallRule = {
      id: ruleId,
      source_ip: newRule.source_ip || "*",
      destination_ip: newRule.destination_ip || "*",
      protocol: newRule.protocol || "any",
      port: newRule.port || "*",
      action: newRule.action || "deny"
    };
    
    setRules(prev => ({
      ...prev,
      [currentScenario.id]: [...(prev[currentScenario.id] || []), newRuleWithId]
    }));
    
    // Reset the new rule form
    setNewRule({
      source_ip: "*",
      destination_ip: "*",
      protocol: "any",
      port: "*",
      action: "deny"
    });
  };
  
  // Delete a rule
  const deleteRule = (scenarioId: string, ruleId: string) => {
    setRules(prev => ({
      ...prev,
      [scenarioId]: prev[scenarioId].filter(rule => rule.id !== ruleId)
    }));
  };
  
  // Move to next scenario
  const handleNext = () => {
    if (currentScenarioIndex < scenarios.length - 1) {
      setCurrentScenarioIndex(currentScenarioIndex + 1);
    }
  };
  
  // Move to previous scenario
  const handlePrevious = () => {
    if (currentScenarioIndex > 0) {
      setCurrentScenarioIndex(currentScenarioIndex - 1);
    }
  };
  
  // Toggle hint visibility
  const toggleHint = (scenarioId: string) => {
    setShowHints(prev => ({
      ...prev,
      [scenarioId]: !prev[scenarioId]
    }));
  };
  
  // Toggle solution visibility
  const toggleSolution = (scenarioId: string) => {
    setShowSolutions(prev => ({
      ...prev,
      [scenarioId]: !prev[scenarioId]
    }));
  };
  
  // Calculate overall lab score (average of all scenario scores)
  const calculateOverallScore = () => {
    const completedScenarios = Object.values(results);
    if (completedScenarios.length === 0) return 0;
    
    const totalScore = completedScenarios.reduce((sum, result) => sum + result.score, 0);
    return Math.round(totalScore / completedScenarios.length);
  };
  
  // Submit the lab results
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      const finalScore = calculateOverallScore();
      const pointsEarned = Math.round((finalScore / 100) * activity.points);
      
      // Prepare answers object to save
      const answersToSave = {
        rules,
        results,
      };
      
      // Update activity progress in the database
      const response = await fetch(`/api/activities/${activity.id}/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isCompleted: true,
          score: finalScore,
          pointsEarned,
          answers: answersToSave
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update progress");
      }
      
      setIsCompleted(true);
      
      // Refresh the page data
      router.refresh();
    } catch (error) {
      console.error("Error submitting lab:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Reset the lab for reattempt
  const handleReattempt = async () => {
    try {
      // Reset the progress on the server
      const response = await fetch(`/api/activities/${activity.id}/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isCompleted: false,
          score: 0,
          pointsEarned: 0,
          answers: {}
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to reset progress");
      }
      
      // Reset all state to initial values
      setRules({});
      setResults({});
      setShowHints({});
      setShowSolutions({});
      setScenariosCompleted(0);
      setCurrentScenarioIndex(0);
      setIsCompleted(false);
      
      // Refresh the page data
      router.refresh();
    } catch (error) {
      console.error("Error resetting lab:", error);
    }
  };
  
  // If already completed, show the completed state
  if (isCompleted) {
    return (
      <div className="text-center py-6">
        <div className="mb-4">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-white">Firewall Lab Completed</h2>
        <p className="text-white mb-2">
          You've successfully completed the firewall configuration lab with a score of <strong>{calculateOverallScore()}%</strong>.
        </p>
        <p className="text-gray-400 mb-6">You secured {scenariosCompleted} network environments.</p>
        
        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={handleReattempt}>
            Try Again
          </Button>
          <Button variant="default" asChild>
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">{content.title}</h2>
          <p className="text-gray-400">{content.description}</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Progress value={(scenariosCompleted / scenarios.length) * 100} className="w-32 h-2" />
          <span className="text-sm text-gray-400">
            {scenariosCompleted}/{scenarios.length} completed
          </span>
        </div>
      </div>
      
      <Tabs defaultValue="simulator" className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="simulator">Firewall Simulator</TabsTrigger>
          <TabsTrigger value="instructions">Instructions</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>
        
        <TabsContent value="simulator" className="space-y-6">
          {/* Scenario Header */}
          <div className="bg-black/30 border border-blue-500/20 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Scenario {currentScenarioIndex + 1}: {currentScenario?.name}
                </h3>
                <p className="text-gray-400 mt-1">{currentScenario?.description}</p>
                <div className="mt-2">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                    Goal: {currentScenario?.goal}
                  </Badge>
                </div>
              </div>
              
              <div className="flex space-x-2">
                {currentScenario?.hint && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-400"
                    onClick={() => toggleHint(currentScenario.id)}
                  >
                    <Info className="h-4 w-4 mr-1" />
                    {showHints[currentScenario.id] ? "Hide Hint" : "Show Hint"}
                  </Button>
                )}
                
                {currentScenario?.solution && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-400"
                    onClick={() => toggleSolution(currentScenario.id)}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    {showSolutions[currentScenario.id] ? "Hide Solution" : "Show Solution"}
                  </Button>
                )}
              </div>
            </div>
            
            {showHints[currentScenario?.id] && currentScenario?.hint && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
                <p className="text-yellow-200 text-sm">{currentScenario.hint}</p>
              </div>
            )}
            
            {showSolutions[currentScenario?.id] && currentScenario?.solution && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-md">
                <h4 className="text-green-300 text-sm font-medium mb-2">Recommended Solution:</h4>
                <div className="text-green-200 text-sm" dangerouslySetInnerHTML={{ __html: currentScenario.solution }} />
              </div>
            )}
          </div>
          
          {/* Rule Configuration */}
          <Card className="bg-black/30 border-blue-500/20">
            <CardHeader>
              <CardTitle className="text-white">Firewall Rules</CardTitle>
              <CardDescription>
                Configure rules to protect the network. Rules are evaluated top to bottom.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Rules */}
              <div className="space-y-2">
                {(rules[currentScenario?.id] || []).length > 0 ? (
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-400 mb-2">
                    <div className="col-span-2">Source IP</div>
                    <div className="col-span-2">Destination IP</div>
                    <div className="col-span-2">Protocol</div>
                    <div className="col-span-2">Port</div>
                    <div className="col-span-2">Action</div>
                    <div className="col-span-2"></div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-400">
                    <Shield className="h-10 w-10 text-gray-600 mx-auto mb-2" />
                    <p>No rules configured. All traffic will be allowed by default.</p>
                  </div>
                )}
                
                <AnimatePresence>
                  {(rules[currentScenario?.id] || []).map((rule, index) => (
                    <motion.div
                      key={rule.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-12 gap-2 p-2 rounded-md bg-gray-800/40 items-center"
                    >
                      <div className="col-span-2 truncate" title={rule.source_ip}>{rule.source_ip}</div>
                      <div className="col-span-2 truncate" title={rule.destination_ip}>{rule.destination_ip}</div>
                      <div className="col-span-2 truncate">{rule.protocol}</div>
                      <div className="col-span-2 truncate">{rule.port}</div>
                      <div className="col-span-2">
                        <Badge className={rule.action === "allow" ? "bg-green-600" : "bg-red-600"}>
                          {rule.action}
                        </Badge>
                      </div>
                      <div className="col-span-2 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-gray-400 hover:text-red-500"
                          onClick={() => deleteRule(currentScenario.id, rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              
              {/* Add New Rule */}
              <div className="pt-4 border-t border-gray-800">
                <h4 className="text-sm font-medium text-white mb-3">Add New Rule</h4>
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-2">
                    <Label htmlFor="source_ip" className="sr-only">Source IP</Label>
                    <Input
                      id="source_ip"
                      placeholder="Source IP"
                      value={newRule.source_ip || "*"}
                      onChange={(e) => setNewRule({ ...newRule, source_ip: e.target.value })}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="destination_ip" className="sr-only">Destination IP</Label>
                    <Input
                      id="destination_ip"
                      placeholder="Destination IP"
                      value={newRule.destination_ip || "*"}
                      onChange={(e) => setNewRule({ ...newRule, destination_ip: e.target.value })}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="protocol" className="sr-only">Protocol</Label>
                    <Select
                      value={newRule.protocol || "any"}
                      onValueChange={(value: string) => setNewRule({ ...newRule, protocol: value })}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700">
                        <SelectValue placeholder="Protocol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">any</SelectItem>
                        <SelectItem value="tcp">tcp</SelectItem>
                        <SelectItem value="udp">udp</SelectItem>
                        <SelectItem value="icmp">icmp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="port" className="sr-only">Port</Label>
                    <Input
                      id="port"
                      placeholder="Port/Range"
                      value={newRule.port || "*"}
                      onChange={(e) => setNewRule({ ...newRule, port: e.target.value })}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="action" className="sr-only">Action</Label>
                    <Select
                      value={newRule.action || "deny"}
                      onValueChange={(value: string) => setNewRule({ ...newRule, action: value as "allow" | "deny" })}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700">
                        <SelectValue placeholder="Action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="allow">allow</SelectItem>
                        <SelectItem value="deny">deny</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="col-span-2">
                    <Button 
                      onClick={addRule} 
                      className="w-full"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Rule
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-2">
              <div className="text-gray-400 text-sm">
                <span className="text-gray-500">Wildcards: </span>
                "*" for all IPs/ports, "any" for all protocols
              </div>
              <Button 
                onClick={() => applyRules(currentScenario.id)}
                variant="default"
              >
                Test Firewall
              </Button>
            </CardFooter>
          </Card>
          
          {/* Simulation Results */}
          {results[currentScenario?.id] && (
            <Card className="bg-black/30 border-green-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-green-500" />
                  Firewall Effectiveness
                </CardTitle>
                <CardDescription>
                  Results of your firewall configuration against the traffic
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="mb-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-400">Security Score</span>
                        <span className="font-semibold text-white">{results[currentScenario.id].score}%</span>
                      </div>
                      <Progress value={results[currentScenario.id].score} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-500/10 border border-green-500/20 rounded-md p-3">
                        <div className="text-2xl font-bold text-white">
                          {results[currentScenario.id].blockedMalicious}
                        </div>
                        <div className="text-sm text-green-400">Blocked malicious</div>
                      </div>
                      
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3">
                        <div className="text-2xl font-bold text-white">
                          {results[currentScenario.id].allowedBenign}
                        </div>
                        <div className="text-sm text-blue-400">Allowed legitimate</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-white mb-1">Traffic Summary</h4>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-green-400">
                        Blocked: {results[currentScenario.id].blocked.length} packets
                      </span>
                      <span className="text-blue-400">
                        Allowed: {results[currentScenario.id].allowed.length} packets
                      </span>
                    </div>
                    
                    <div>
                      <h5 className="text-xs font-medium text-red-400 mb-2">
                        {results[currentScenario.id].allowed.filter(p => p.is_malicious).length > 0 ? (
                          <>
                            <ShieldAlert className="h-3 w-3 inline mr-1" />
                            Malicious Traffic Detected in Allowed Traffic
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-3 w-3 inline mr-1" />
                            All Malicious Traffic Blocked
                          </>
                        )}
                      </h5>
                      
                      {results[currentScenario.id].allowed.filter(p => p.is_malicious).length > 0 && (
                        <div className="text-xs text-gray-400 bg-gray-800/40 rounded-md p-2 max-h-[100px] overflow-y-auto">
                          {results[currentScenario.id].allowed
                            .filter(p => p.is_malicious)
                            .map(p => (
                              <div key={p.id} className="mb-1 last:mb-0">
                                • {p.source_ip}:{p.source_port} → {p.destination_ip}:{p.destination_port} ({p.protocol})
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Navigation Controls */}
          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentScenarioIndex === 0}
            >
              Previous Scenario
            </Button>
            
            {currentScenarioIndex === scenarios.length - 1 ? (
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting || scenariosCompleted < scenarios.length}
              >
                {isSubmitting ? "Submitting..." : "Complete Lab"}
              </Button>
            ) : (
              <Button 
                onClick={handleNext}
                disabled={!results[currentScenario?.id]}
              >
                Next Scenario
              </Button>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="instructions" className="space-y-4">
          <Card className="bg-black/30 border-blue-500/20">
            <CardHeader>
              <CardTitle className="text-white">Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none text-white">
                <div dangerouslySetInnerHTML={{ __html: content.instructions }} className="text-white" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-black/30 border-blue-500/20">
            <CardHeader>
              <CardTitle className="text-white">Setup Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none text-white">
                <div dangerouslySetInnerHTML={{ __html: content.setupGuide }} className="text-white" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="resources" className="space-y-4">
          <Card className="bg-black/30 border-blue-500/20">
            <CardHeader>
              <CardTitle className="text-white">Helpful Resources</CardTitle>
            </CardHeader>
            <CardContent>
              {content.resources && content.resources.length > 0 ? (
                <ul className="space-y-2">
                  {content.resources.map((resource, index) => (
                    <li key={index} className="flex items-center">
                      <ArrowRight className="h-4 w-4 mr-2 text-blue-400" />
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
                <p className="text-gray-400">No external resources are available for this lab.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 