"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CheckCircle, AlertTriangle, Terminal, ExternalLink, Shield, RefreshCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface UserRecord {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface SQLInjectionLabProps {
  activity: any;
  userId: string;
  progress: any;
}

export default function SQLInjectionLab({ activity, userId, progress }: SQLInjectionLabProps) {
  const router = useRouter();
  const [isCompleted, setIsCompleted] = useState(progress?.isCompleted || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("instructions");
  const [queryInput, setQueryInput] = useState("");
  const [queryResults, setQueryResults] = useState<UserRecord[]>([]);
  const [successMessages, setSuccessMessages] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM users WHERE username = '{input}'");
  const [challengeComplete, setChallengeComplete] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [vulnerableMode, setVulnerableMode] = useState(true);
  const [visibleSolutions, setVisibleSolutions] = useState<Record<string, boolean>>({});

  // Simulated database records
  const userRecords: UserRecord[] = [
    { id: 1, username: "admin", email: "admin@company.com", role: "admin" },
    { id: 2, username: "john", email: "john@company.com", role: "user" },
    { id: 3, username: "sarah", email: "sarah@company.com", role: "user" },
    { id: 4, username: "alice", email: "alice@company.com", role: "manager" },
    { id: 5, username: "bob", email: "bob@company.com", role: "user" },
  ];

  // Extracted content
  const content = typeof activity.content === 'string'
    ? JSON.parse(activity.content)
    : activity.content;

  // Get scenarios from content if available
  const scenarios = content.scenarios || [];
  
  // Toggle solution visibility
  const toggleSolution = (scenarioId: string) => {
    setVisibleSolutions({
      ...visibleSolutions,
      [scenarioId]: !visibleSolutions[scenarioId]
    });
  };

  // Function to process SQL query (simulated)
  const executeQuery = () => {
    setAttempts(attempts + 1);
    setErrorMessage("");
    
    if (queryInput.trim() === "") {
      setErrorMessage("Please enter a username to search");
      return;
    }

    // Check for SQL injection patterns
    const hasInjection = queryInput.includes("'") || 
                         queryInput.includes(";") || 
                         queryInput.includes("--") ||
                         queryInput.includes("OR") ||
                         queryInput.includes("=");
    
    if (hasInjection) {
      if (vulnerableMode) {
        // In vulnerable mode, the injection "works"
        setQueryResults(userRecords);
        
        // Check if this is the admin user challenge
        if (queryInput.toLowerCase().includes("' or '1'='1") || 
            queryInput.toLowerCase().includes("' or 1=1") ||
            queryInput.toLowerCase().includes("' or '1'='1'--")) {
          if (!successMessages.includes("challenge1")) {
            setSuccessMessages([...successMessages, "challenge1"]);
            toast.success("Challenge complete: You successfully performed a SQL injection!");
          }
        }
        
        // Check if this is the admin-only records challenge
        if ((queryInput.toLowerCase().includes("admin") && hasInjection) ||
            queryInput.toLowerCase().includes("role='admin'")) {
          if (!successMessages.includes("challenge2")) {
            setSuccessMessages([...successMessages, "challenge2"]);
            toast.success("Challenge complete: You accessed admin records!");
          }
        }
      } else {
        // In secure mode, the injection is blocked
        setErrorMessage("Input validation prevented potential SQL injection attempt");
        setQueryResults([]);
      }
    } else {
      // Regular query - just find the matching user
      const result = userRecords.filter(user => 
        user.username.toLowerCase() === queryInput.toLowerCase()
      );
      setQueryResults(result);
    }
    
    // Check for completion
    if (successMessages.length >= 2) {
      setChallengeComplete(true);
    }
  };

  const toggleSecurityMode = () => {
    setVulnerableMode(!vulnerableMode);
    setQueryResults([]);
    setErrorMessage("");
    toast.info(vulnerableMode ? 
      "Security mode enabled: Input validation is now active" : 
      "Vulnerable mode enabled: SQL injection is now possible");
  };

  // Submit completion to backend
  const handleSubmitLab = async () => {
    if (!challengeComplete) {
      toast.error("Please complete all challenges before submitting");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/activities/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          activityId: activity.id,
          isCompleted: true,
          pointsEarned: activity.points,
        }),
      });

      if (response.ok) {
        setIsCompleted(true);
        toast.success("Lab completed successfully!");
        router.refresh();
      } else {
        toast.error("Failed to submit lab progress");
      }
    } catch (error) {
      console.error("Error submitting lab:", error);
      toast.error("An error occurred while submitting");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{content.title || "SQL Injection Lab"}</h2>
          <p className="text-muted-foreground">
            {content.description || "Practice identifying and exploiting SQL injection vulnerabilities"}
          </p>
        </div>
        {isCompleted && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1 px-3 py-1">
            <CheckCircle className="h-4 w-4" />
            Completed
          </Badge>
        )}
      </div>

      <Tabs defaultValue="instructions" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="instructions">Instructions</TabsTrigger>
          <TabsTrigger value="lab">SQL Injection Lab</TabsTrigger>
          <TabsTrigger value="solutions">Solutions</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="submit">Submit</TabsTrigger>
        </TabsList>

        <TabsContent value="instructions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lab Instructions</CardTitle>
              <CardDescription>Learn how SQL injection works and how to prevent it</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content.instructions || `
                <p>In this lab, you'll learn about SQL injection, one of the most common web application vulnerabilities.</p>
                <p>SQL injection occurs when user input is incorrectly filtered and directly included in SQL queries, allowing attackers to manipulate the database.</p>
                <h3>Objectives:</h3>
                <ol>
                  <li>Understand how SQL injection works</li>
                  <li>Learn common SQL injection techniques</li>
                  <li>Test a vulnerable application</li>
                  <li>Learn how to prevent SQL injection</li>
                </ol>
                <h3>Challenges:</h3>
                <ol>
                  <li>Use SQL injection to bypass login and retrieve all user records</li>
                  <li>Use SQL injection to access admin-only records</li>
                </ol>
              `}} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Setup Guide</CardTitle>
              <CardDescription>How to use the SQL injection lab environment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content.setupGuide || `
                <p>The lab simulates a user search function in a web application with an SQL injection vulnerability.</p>
                <p>You'll see the underlying SQL query that runs when you search, and your goal is to manipulate this query using SQL injection techniques.</p>
                <h3>Common SQL Injection Techniques:</h3>
                <ul>
                  <li><code>' OR '1'='1</code> - Returns all records because the condition is always true</li>
                  <li><code>' OR 1=1--</code> - The double dash (--) comments out the rest of the query</li>
                  <li><code>' UNION SELECT...</code> - Combines results from multiple tables</li>
                </ul>
                <p>You can toggle between "Vulnerable Mode" and "Secure Mode" to see how proper input validation prevents these attacks.</p>
              `}} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lab" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>SQL Injection Simulator</span>
                <Button
                  variant={vulnerableMode ? "destructive" : "outline"}
                  size="sm"
                  onClick={toggleSecurityMode}
                  className="flex items-center gap-2"
                >
                  {vulnerableMode ? 
                    <><AlertTriangle className="h-4 w-4" /> Vulnerable Mode</> : 
                    <><Shield className="h-4 w-4" /> Secure Mode</>
                  }
                </Button>
              </CardTitle>
              <CardDescription>
                Search for users in the database and try SQL injection techniques
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Current SQL Query:</Label>
                <Card className="bg-slate-950 text-slate-50 p-4 font-mono text-sm overflow-x-auto">
                  {sqlQuery.replace('{input}', queryInput || '[user input]')}
                </Card>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Enter Username to Search:</Label>
                <div className="flex gap-2">
                  <Input
                    id="username"
                    placeholder="e.g., john or ' OR '1'='1"
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={executeQuery} className="flex gap-2 items-center">
                    <Terminal className="h-4 w-4" /> Execute Query
                  </Button>
                </div>
                {errorMessage && (
                  <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Query Results:</Label>
                <Card className="border p-0 overflow-hidden">
                  {queryResults.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-4 py-2 text-left">ID</th>
                            <th className="px-4 py-2 text-left">Username</th>
                            <th className="px-4 py-2 text-left">Email</th>
                            <th className="px-4 py-2 text-left">Role</th>
                          </tr>
                        </thead>
                        <tbody>
                          {queryResults.map((user) => (
                            <tr key={user.id} className="border-t">
                              <td className="px-4 py-2">{user.id}</td>
                              <td className="px-4 py-2">{user.username}</td>
                              <td className="px-4 py-2">{user.email}</td>
                              <td className="px-4 py-2">
                                <Badge variant={user.role === 'admin' ? "destructive" : "secondary"}>
                                  {user.role}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-white/85">
                      {attempts > 0 ? "No results found" : "Execute a query to see results"}
                    </div>
                  )}
                </Card>
              </div>

              <div className="space-y-2">
                <Label>Challenges:</Label>
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    {successMessages.includes("challenge1") ? 
                      <CheckCircle className="h-5 w-5 text-green-500" /> : 
                      <div className="h-5 w-5 rounded-full border-2 border-muted" />
                    }
                    <span className={successMessages.includes("challenge1") ? "text-green-500 font-medium" : ""}>
                      Challenge 1: Bypass authentication to retrieve all user records
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {successMessages.includes("challenge2") ? 
                      <CheckCircle className="h-5 w-5 text-green-500" /> : 
                      <div className="h-5 w-5 rounded-full border-2 border-muted" />
                    }
                    <span className={successMessages.includes("challenge2") ? "text-green-500 font-medium" : ""}>
                      Challenge 2: Access admin-only records
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prevention Techniques</CardTitle>
              <CardDescription>How to protect against SQL injection attacks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose max-w-none">
                <p>SQL injection can be prevented by implementing these security measures:</p>
                <ol>
                  <li><strong>Parameterized Queries/Prepared Statements:</strong> Use query parameters instead of directly embedding user input in SQL queries</li>
                  <li><strong>Input Validation:</strong> Validate and sanitize all user inputs</li>
                  <li><strong>Stored Procedures:</strong> Use database stored procedures to abstract SQL execution</li>
                  <li><strong>ORM Libraries:</strong> Use Object-Relational Mapping libraries which often include built-in protection</li>
                  <li><strong>Principle of Least Privilege:</strong> Limit database account permissions</li>
                </ol>
                <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 text-black">
                  <p className="font-semibold">Why Secure Mode Works:</p>
                  <p>In secure mode, the application validates the input and rejects suspicious characters like quotes, semicolons, and SQL keywords. This prevents attackers from breaking out of the string context and injecting malicious SQL code.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="solutions" className="space-y-4">
          {scenarios.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Challenge Solutions</CardTitle>
                <CardDescription>Detailed solutions for each SQL injection challenge</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {scenarios.map((scenario: any) => (
                  <div key={scenario.id} className="space-y-4 border-b pb-6 mb-6 last:border-0">
                    <div>
                      <h3 className="font-semibold text-lg">{scenario.name}</h3>
                      <p className="text-white/85">{scenario.description}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Vulnerable Query</h4>
                      <div className="bg-slate-950 text-slate-50 p-3 rounded font-mono text-sm mb-4 overflow-x-auto">
                        {scenario.sqlQuery}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Solution</h4>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => toggleSolution(scenario.id)}
                          className="h-7 px-3 text-xs"
                        >
                          {visibleSolutions[scenario.id] ? "Hide" : "Show Solution"}
                        </Button>
                      </div>
                      
                      {visibleSolutions[scenario.id] && scenario.solution ? (
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md border">
                          <div dangerouslySetInnerHTML={{ __html: scenario.solution }} />
                        </div>
                      ) : (
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md border text-white/85">
                          Click the "Show Solution" button to view the detailed solution.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Solutions Available</CardTitle>
                <CardDescription>This lab doesn't have any specific scenario solutions defined</CardDescription>
              </CardHeader>
              <CardContent>
                <p>The solutions for this lab are not currently available. Please refer to the instructions and resources sections for guidance.</p>
              </CardContent>
            </Card>
          )}
          
          {content.summary && (
            <Card>
              <CardHeader>
                <CardTitle>Summary & Prevention Techniques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: content.summary }} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Additional Resources</CardTitle>
              <CardDescription>Learn more about SQL injection and web security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {(content.resources || [
                  { name: "OWASP SQL Injection", url: "https://owasp.org/www-community/attacks/SQL_Injection" },
                  { name: "SQL Injection Cheat Sheet", url: "https://portswigger.net/web-security/sql-injection/cheat-sheet" },
                  { name: "OWASP Top 10", url: "https://owasp.org/www-project-top-ten/" },
                  { name: "SQL Injection Prevention", url: "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html" }
                ]).map((resource: { name: string; url: string }, index: number) => (
                  <a 
                    key={index}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 rounded-md border hover:bg-muted transition-colors"
                  >
                    <div className="flex-1">{resource.name}</div>
                    <ExternalLink className="h-4 w-4 opacity-70" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submit">
          <Card>
            <CardHeader>
              <CardTitle>Complete the Lab</CardTitle>
              <CardDescription>Submit your work to receive credit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose max-w-none">
                <p>Before submitting, make sure you have:</p>
                <ul>
                  <li className={successMessages.includes("challenge1") ? "text-green-600" : ""}>
                    Completed Challenge 1: Bypassed authentication using SQL injection
                  </li>
                  <li className={successMessages.includes("challenge2") ? "text-green-600" : ""}>
                    Completed Challenge 2: Accessed admin-only records
                  </li>
                  <li>Understood how SQL injection works and how to prevent it</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setActiveTab("lab")}
              >
                Return to Lab
              </Button>
              <Button
                onClick={handleSubmitLab}
                disabled={isSubmitting || isCompleted || !challengeComplete}
                className="flex items-center gap-2"
              >
                {isSubmitting ? "Submitting..." : isCompleted ? "Completed" : "Submit Lab"}
                {isCompleted && <CheckCircle className="h-4 w-4" />}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 