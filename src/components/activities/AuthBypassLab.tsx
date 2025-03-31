"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CheckCircle, Terminal, ExternalLink, Shield, AlertCircle, Lock, Unlock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface AuthBypassLabProps {
  activity: any;
  userId: string;
  progress: any;
}

export default function AuthBypassLab({ activity, userId, progress }: AuthBypassLabProps) {
  const router = useRouter();
  const [isCompleted, setIsCompleted] = useState(progress?.isCompleted || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("instructions");
  
  // Lab-specific state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [adminAccess, setAdminAccess] = useState(false);
  const [successSteps, setSuccessSteps] = useState<string[]>([]);
  const [requestHeaders, setRequestHeaders] = useState({
    "Authorization": "",
    "X-User-Role": ""
  });
  const [requestMethod, setRequestMethod] = useState("POST");
  const [requestEndpoint, setRequestEndpoint] = useState("/api/login");
  const [requestBody, setRequestBody] = useState(JSON.stringify({
    username: "",
    password: ""
  }, null, 2));

  // Extracted content from activity
  const content = typeof activity.content === 'string'
    ? JSON.parse(activity.content)
    : activity.content;

  // Handle normal login attempt
  const handleLoginAttempt = () => {
    if (!username || !password) {
      toast.error("Please provide both username and password");
      return;
    }

    // Simulate login logic
    if (username === "user" && password === "password123") {
      toast.success("Login successful as regular user");
      setLoggedIn(true);
      if (!successSteps.includes("regular_login")) {
        setSuccessSteps([...successSteps, "regular_login"]);
      }
    } else {
      toast.error("Invalid username or password");
    }
  };

  // Handle bypass attempt via headers
  const handleBypassAttempt = () => {
    try {
      const parsedBody = JSON.parse(requestBody);
      
      // Check various auth bypass techniques
      
      // Check header-based bypass
      if (requestHeaders["X-User-Role"]?.toLowerCase() === "admin" || 
          requestHeaders["Authorization"]?.includes("admin")) {
        toast.success("Authentication bypassed! You've gained admin access.");
        setAdminAccess(true);
        setLoggedIn(true);
        if (!successSteps.includes("header_bypass")) {
          setSuccessSteps([...successSteps, "header_bypass"]);
        }
      } 
      // Check request body bypass
      else if (parsedBody.username?.includes("admin") && 
              (parsedBody.password === "*" || parsedBody.role === "admin")) {
        toast.success("Authentication bypassed via request body manipulation!");
        setAdminAccess(true);
        setLoggedIn(true);
        if (!successSteps.includes("body_bypass")) {
          setSuccessSteps([...successSteps, "body_bypass"]);
        }
      }
      // Check endpoint manipulation
      else if (requestEndpoint.includes("admin") || requestEndpoint.includes("bypass")) {
        toast.success("Authentication bypassed via endpoint manipulation!");
        setAdminAccess(true);
        setLoggedIn(true);
        if (!successSteps.includes("endpoint_bypass")) {
          setSuccessSteps([...successSteps, "endpoint_bypass"]);
        }
      }
      // SQL Injection attempt
      else if (username.includes("'") || username.includes("--") || 
               username.includes("1=1") || password.includes("'") || 
               password.includes("--") || password.includes("1=1")) {
        toast.success("SQL Injection successful! Authentication bypassed.");
        setAdminAccess(true);
        setLoggedIn(true);
        if (!successSteps.includes("sql_injection")) {
          setSuccessSteps([...successSteps, "sql_injection"]);
        }
      }
      else {
        toast.error("Bypass attempt failed. Try a different approach.");
      }
    } catch (e) {
      toast.error("Invalid JSON in request body");
    }
  };

  // Reset the lab
  const resetLab = () => {
    setUsername("");
    setPassword("");
    setLoggedIn(false);
    setAdminAccess(false);
    setRequestHeaders({
      "Authorization": "",
      "X-User-Role": ""
    });
    setRequestMethod("POST");
    setRequestEndpoint("/api/login");
    setRequestBody(JSON.stringify({
      username: "",
      password: ""
    }, null, 2));
  };

  // Handle form submission
  const handleSubmitLab = async () => {
    try {
      // Only allow submission if user has completed at least one bypass method
      if (successSteps.length === 0) {
        toast.error("You need to successfully bypass authentication at least once to complete the lab");
        return;
      }

      setIsSubmitting(true);
      
      // Update activity progress in the database
      const response = await fetch(`/api/activities/${activity.id}/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isCompleted: true,
          answers: { successSteps },
          score: 100, // Full score for completing the lab
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
      toast.error("Failed to submit lab progress");
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
        <p className="text-white mb-6">You've successfully completed this authentication bypass lab.</p>
        
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
      <Tabs defaultValue="instructions" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="instructions">Instructions</TabsTrigger>
          <TabsTrigger value="lab">Lab Environment</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>
        
        <TabsContent value="instructions" className="space-y-4">
          <div className="prose prose-invert max-w-none mb-6 text-white">
            <h2 className="text-2xl font-bold text-white">Authentication Bypass Lab</h2>
            <p className="text-white">
              In this lab, you'll practice different techniques to bypass authentication mechanisms 
              and gain unauthorized access to protected resources.
            </p>
            <h3 className="text-xl font-semibold text-white mt-4">Objectives</h3>
            <ul className="list-disc pl-5 text-white">
              <li>Successfully log in as a regular user</li>
              <li>Use HTTP header manipulation to bypass authentication</li>
              <li>Explore JSON payload manipulation for authentication bypass</li>
              <li>Try endpoint manipulation to access admin functionality</li>
              <li>Test for SQL injection vulnerabilities</li>
            </ul>
            <p className="text-white mt-4">
              Remember that in a real-world scenario, these techniques would be used ethically by security 
              professionals to identify vulnerabilities in systems, not to conduct actual attacks.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="lab" className="space-y-4">
          {loggedIn ? (
            <Card className="bg-black/30 border-green-500/30">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Shield className="h-5 w-5 mr-2 text-green-500" />
                  {adminAccess ? "Admin Dashboard" : "User Dashboard"}
                </CardTitle>
                <CardDescription className="text-gray-300">
                  {adminAccess 
                    ? "You have successfully bypassed authentication and gained admin access!" 
                    : "You are logged in as a regular user."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {adminAccess ? (
                    <div className="bg-green-900/20 p-4 rounded-md border border-green-500/30">
                      <h3 className="text-green-400 font-semibold flex items-center">
                        <Unlock className="h-4 w-4 mr-2" />
                        Admin Access Achieved
                      </h3>
                      <p className="text-white mt-2">
                        Congratulations! You have successfully bypassed the authentication controls and gained 
                        administrative access to the system. In a real application, this would be a critical 
                        security vulnerability.
                      </p>
                      <div className="mt-4">
                        <Badge variant="outline" className="bg-green-900/30 text-green-400 border-green-500/30">
                          Authentication Bypassed
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-900/20 p-4 rounded-md border border-blue-500/30">
                      <h3 className="text-blue-400 font-semibold flex items-center">
                        <Lock className="h-4 w-4 mr-2" />
                        Regular User Access
                      </h3>
                      <p className="text-white mt-2">
                        You are currently logged in as a regular user. Try to find ways to bypass the 
                        authentication to gain admin access.
                      </p>
                    </div>
                  )}
                  
                  <div className="pt-4">
                    <Button variant="outline" onClick={resetLab}>
                      Reset Lab
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card className="bg-black/30 border-blue-500/20">
                <CardHeader>
                  <CardTitle className="text-white">Standard Login</CardTitle>
                  <CardDescription className="text-gray-300">
                    Try to log in with the regular credentials: username "user" and password "password123"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="username" className="text-white">Username</Label>
                      <Input
                        id="username"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="bg-black/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password" className="text-white">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-black/50"
                      />
                    </div>
                    <Button onClick={handleLoginAttempt}>Login</Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-black/30 border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-white">Authentication Bypass</CardTitle>
                  <CardDescription className="text-gray-300">
                    Modify the HTTP request to bypass authentication controls
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="requestMethod" className="text-white">HTTP Method</Label>
                      <select
                        id="requestMethod"
                        value={requestMethod}
                        onChange={(e) => setRequestMethod(e.target.value)}
                        className="w-full rounded-md border border-gray-600 bg-black/50 px-3 py-2 text-white"
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="requestEndpoint" className="text-white">Endpoint</Label>
                      <Input
                        id="requestEndpoint"
                        placeholder="/api/login"
                        value={requestEndpoint}
                        onChange={(e) => setRequestEndpoint(e.target.value)}
                        className="bg-black/50"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="authorization" className="text-white">Authorization Header</Label>
                      <Input
                        id="authorization"
                        placeholder="Bearer token..."
                        value={requestHeaders.Authorization}
                        onChange={(e) => setRequestHeaders({...requestHeaders, Authorization: e.target.value})}
                        className="bg-black/50"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="userRole" className="text-white">X-User-Role Header</Label>
                      <Input
                        id="userRole"
                        placeholder="user"
                        value={requestHeaders["X-User-Role"]}
                        onChange={(e) => setRequestHeaders({...requestHeaders, "X-User-Role": e.target.value})}
                        className="bg-black/50"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="requestBody" className="text-white">Request Body (JSON)</Label>
                      <Textarea
                        id="requestBody"
                        placeholder="{}"
                        value={requestBody}
                        onChange={(e) => setRequestBody(e.target.value)}
                        className="h-32 bg-black/50 font-mono"
                      />
                    </div>
                    
                    <Button 
                      onClick={handleBypassAttempt}
                      variant="secondary"
                    >
                      Send Request
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Progress tracker */}
          <Card className="bg-black/30 border-amber-500/20 mt-6">
            <CardHeader>
              <CardTitle className="text-white text-lg">Progress Tracker</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full ${successSteps.includes("regular_login") ? "bg-green-500" : "bg-gray-600"}`}></div>
                  <span className="text-white">Regular Login</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full ${successSteps.includes("header_bypass") ? "bg-green-500" : "bg-gray-600"}`}></div>
                  <span className="text-white">Header Manipulation Bypass</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full ${successSteps.includes("body_bypass") ? "bg-green-500" : "bg-gray-600"}`}></div>
                  <span className="text-white">Request Body Bypass</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full ${successSteps.includes("endpoint_bypass") ? "bg-green-500" : "bg-gray-600"}`}></div>
                  <span className="text-white">Endpoint Manipulation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full ${successSteps.includes("sql_injection") ? "bg-green-500" : "bg-gray-600"}`}></div>
                  <span className="text-white">SQL Injection Bypass</span>
                </div>
              </div>
              
              <div className="mt-6">
                <Button 
                  onClick={handleSubmitLab}
                  disabled={isSubmitting || successSteps.length === 0}
                  className="w-full"
                >
                  {isSubmitting ? "Submitting..." : "Complete Lab"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="resources" className="space-y-4">
          <Card className="bg-black/30 border-blue-500/20">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <ExternalLink className="h-5 w-5 mr-2" />
                Additional Resources
              </CardTitle>
              <CardDescription className="text-gray-300">
                Learn more about authentication bypass techniques
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-white">
                <li>
                  <a 
                    href="https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/04-Authentication_Testing/04-Testing_for_Bypassing_Authentication_Schema" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline flex items-center"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    OWASP Testing for Bypassing Authentication
                  </a>
                </li>
                <li>
                  <a 
                    href="https://portswigger.net/web-security/authentication" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline flex items-center"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    PortSwigger Authentication Vulnerabilities
                  </a>
                </li>
                <li>
                  <a 
                    href="https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline flex items-center"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    OWASP Authentication Cheat Sheet
                  </a>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 