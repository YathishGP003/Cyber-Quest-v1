"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CheckCircle, Terminal, ExternalLink, Shield, Lock, Smartphone, Mail, Key } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface MFADemoLabProps {
  activity: any;
  userId: string;
  progress: any;
}

export default function MFADemoLab({ activity, userId, progress }: MFADemoLabProps) {
  const router = useRouter();
  const [isCompleted, setIsCompleted] = useState(progress?.isCompleted || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("instructions");
  
  // Lab-specific state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authStep, setAuthStep] = useState<"login" | "mfa" | "authenticated">("login");
  const [mfaMethod, setMfaMethod] = useState<"sms" | "email" | "app">("sms");
  const [mfaCode, setMfaCode] = useState("");
  const [actualMfaCode, setActualMfaCode] = useState("");
  const [completedMethods, setCompletedMethods] = useState<string[]>([]);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isAccountLocked, setIsAccountLocked] = useState(false);
  
  // Extracted content from activity
  const content = typeof activity.content === 'string'
    ? JSON.parse(activity.content)
    : activity.content;

  // Generate a random 6-digit code
  const generateMFACode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Handle login attempt
  const handleLoginAttempt = () => {
    if (isAccountLocked) {
      toast.error("Your account is locked due to too many failed attempts");
      return;
    }
    
    if (!username || !password) {
      toast.error("Please enter both username and password");
      return;
    }
    
    if (username === "testuser" && password === "password123") {
      toast.success("First factor verified. Please complete the second authentication factor.");
      setAuthStep("mfa");
      
      // Generate MFA code
      const code = generateMFACode();
      setActualMfaCode(code);
      
      // Show the code (in a real app, this would be sent to the user's device)
      toast.info(`Your verification code is: ${code}`, { duration: 5000 });
    } else {
      setLoginAttempts(prev => prev + 1);
      
      if (loginAttempts >= 2) {
        setIsAccountLocked(true);
        toast.error("Too many failed login attempts. Your account has been locked.");
      } else {
        toast.error("Invalid username or password");
      }
    }
  };

  // Handle MFA verification
  const handleVerifyMFA = () => {
    if (mfaCode === actualMfaCode) {
      toast.success("Second factor verified successfully! You are now authenticated.");
      setAuthStep("authenticated");
      
      // Add to completed methods if not already done
      if (!completedMethods.includes(mfaMethod)) {
        setCompletedMethods([...completedMethods, mfaMethod]);
      }
    } else {
      toast.error("Invalid verification code");
    }
  };

  // Reset auth flow
  const resetAuth = () => {
    setAuthStep("login");
    setMfaCode("");
    setActualMfaCode("");
    setIsAccountLocked(false);
    setLoginAttempts(0);
  };
  
  // Change MFA method
  const changeMfaMethod = (method: "sms" | "email" | "app") => {
    setMfaMethod(method);
    
    // Generate a new code
    const code = generateMFACode();
    setActualMfaCode(code);
    
    // Show the code (in a real app, this would be sent via the selected method)
    toast.info(`Your new verification code is: ${code}`, { duration: 5000 });
  };

  // Handle form submission
  const handleSubmitLab = async () => {
    try {
      // Only allow submission if user has completed all three MFA methods
      if (completedMethods.length < 3) {
        toast.error("You need to successfully authenticate with all three MFA methods to complete the lab");
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
          answers: { completedMethods },
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
        <p className="text-white mb-6">You've successfully completed the Multi-Factor Authentication lab.</p>
        
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
            <h2 className="text-2xl font-bold text-white">Multi-Factor Authentication Demo</h2>
            <p className="text-white">
              This lab demonstrates how Multi-Factor Authentication (MFA) enhances security by 
              requiring multiple forms of verification before granting access.
            </p>
            <h3 className="text-xl font-semibold text-white mt-4">Objectives</h3>
            <ul className="list-disc pl-5 text-white">
              <li>Experience the MFA login process from a user perspective</li>
              <li>Understand the different types of authentication factors</li>
              <li>Test various MFA methods: SMS, Email, and Authenticator App</li>
              <li>Learn about account lockout mechanisms to prevent brute force attacks</li>
            </ul>
            <p className="text-white mt-4">
              To complete this lab, you'll need to successfully authenticate using all three MFA methods.
            </p>
            <div className="bg-blue-900/20 p-4 rounded-md border border-blue-500/30 mt-4">
              <h4 className="text-blue-400 font-semibold">For this simulation:</h4>
              <ul className="list-disc pl-5 text-white">
                <li>Username: <code className="bg-black/30 px-1 py-0.5 rounded">testuser</code></li>
                <li>Password: <code className="bg-black/30 px-1 py-0.5 rounded">password123</code></li>
                <li>The MFA code will be shown in a notification (in a real system, it would be sent via the selected method)</li>
              </ul>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="lab" className="space-y-4">
          <div className="max-w-md mx-auto">
            {authStep === "login" && (
              <Card className="bg-black/30 border-blue-500/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Lock className="h-5 w-5 mr-2 text-blue-500" />
                    Account Login
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Enter your credentials to start the MFA process
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
                        disabled={isAccountLocked}
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
                        disabled={isAccountLocked}
                      />
                    </div>
                    {isAccountLocked && (
                      <div className="bg-red-900/20 p-3 rounded-md border border-red-500/30">
                        <p className="text-red-400 text-sm">
                          Your account has been temporarily locked due to too many failed login attempts.
                        </p>
                      </div>
                    )}
                    <div className="flex justify-between pt-2">
                      <Button 
                        onClick={handleLoginAttempt}
                        disabled={isAccountLocked}
                      >
                        Log In
                      </Button>
                      {isAccountLocked && (
                        <Button 
                          variant="outline" 
                          onClick={resetAuth}
                        >
                          Reset Demo
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {authStep === "mfa" && (
              <Card className="bg-black/30 border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-purple-500" />
                    Multi-Factor Authentication
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Verify your identity with a second factor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <RadioGroup 
                      value={mfaMethod} 
                      onValueChange={(value) => changeMfaMethod(value as "sms" | "email" | "app")}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sms" id="sms" />
                        <Label htmlFor="sms" className="text-white flex items-center">
                          <Smartphone className="h-4 w-4 mr-2" />
                          SMS Verification
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="email" id="email" />
                        <Label htmlFor="email" className="text-white flex items-center">
                          <Mail className="h-4 w-4 mr-2" />
                          Email Verification
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="app" id="app" />
                        <Label htmlFor="app" className="text-white flex items-center">
                          <Key className="h-4 w-4 mr-2" />
                          Authenticator App
                        </Label>
                      </div>
                    </RadioGroup>
                    
                    <div className="pt-2">
                      <Label htmlFor="verification-code" className="text-white">
                        {mfaMethod === "sms" 
                          ? "Enter the code sent to your phone" 
                          : mfaMethod === "email" 
                            ? "Enter the code sent to your email" 
                            : "Enter the code from your authenticator app"}
                      </Label>
                      <Input
                        id="verification-code"
                        placeholder="6-digit code"
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value)}
                        className="bg-black/50 tracking-widest text-center text-lg"
                        maxLength={6}
                      />
                    </div>
                    
                    <div className="flex justify-between pt-2">
                      <Button 
                        variant="outline" 
                        onClick={resetAuth}
                      >
                        Back
                      </Button>
                      <Button 
                        onClick={handleVerifyMFA}
                        disabled={mfaCode.length !== 6}
                      >
                        Verify
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {authStep === "authenticated" && (
              <Card className="bg-black/30 border-green-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                    Authentication Successful
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    You have successfully completed the MFA process
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-green-900/20 p-4 rounded-md border border-green-500/30">
                    <p className="text-white text-sm">
                      You've successfully authenticated using {mfaMethod === "sms" 
                        ? "SMS verification" 
                        : mfaMethod === "email" 
                          ? "email verification" 
                          : "an authenticator app"}.
                    </p>
                    <p className="text-white text-sm mt-2">
                      This demonstrates how multi-factor authentication provides an additional 
                      layer of security beyond just a password.
                    </p>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <h3 className="text-white font-medium">Completed MFA Methods:</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge 
                        variant="outline"
                        className={completedMethods.includes("sms") 
                          ? "bg-green-900/30 text-green-400 border-green-500/30"
                          : "bg-gray-800/50 text-gray-400 border-gray-700/50"
                        }
                      >
                        <Smartphone className="h-3 w-3 mr-1" />
                        SMS
                      </Badge>
                      <Badge 
                        variant="outline"
                        className={completedMethods.includes("email") 
                          ? "bg-green-900/30 text-green-400 border-green-500/30"
                          : "bg-gray-800/50 text-gray-400 border-gray-700/50"
                        }
                      >
                        <Mail className="h-3 w-3 mr-1" />
                        Email
                      </Badge>
                      <Badge 
                        variant="outline"
                        className={completedMethods.includes("app") 
                          ? "bg-green-900/30 text-green-400 border-green-500/30"
                          : "bg-gray-800/50 text-gray-400 border-gray-700/50"
                        }
                      >
                        <Key className="h-3 w-3 mr-1" />
                        App
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex justify-between pt-6">
                    <Button 
                      variant="outline" 
                      onClick={resetAuth}
                    >
                      Try Another Method
                    </Button>
                    <Button 
                      onClick={handleSubmitLab}
                      disabled={completedMethods.length < 3}
                    >
                      {completedMethods.length < 3 
                        ? `${completedMethods.length}/3 Methods Completed` 
                        : "Complete Lab"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          <Card className="bg-black/30 border-amber-500/20 mt-6">
            <CardHeader>
              <CardTitle className="text-white text-lg">MFA Factors Comparison</CardTitle>
              <CardDescription className="text-gray-300">
                Understanding the different types of authentication factors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-black/50 border-gray-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white text-sm">Something You Know</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm text-white space-y-1 list-disc pl-4">
                        <li>Password</li>
                        <li>PIN code</li>
                        <li>Security questions</li>
                        <li>Passphrase</li>
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-black/50 border-gray-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white text-sm">Something You Have</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm text-white space-y-1 list-disc pl-4">
                        <li>Mobile phone (SMS)</li>
                        <li>Email account</li>
                        <li>Physical token</li>
                        <li>Smart card</li>
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-black/50 border-gray-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white text-sm">Something You Are</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm text-white space-y-1 list-disc pl-4">
                        <li>Fingerprint</li>
                        <li>Facial recognition</li>
                        <li>Voice recognition</li>
                        <li>Retina or iris scan</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
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
                Learn more about multi-factor authentication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-white">
                <li>
                  <a 
                    href="https://www.nist.gov/itl/applied-cybersecurity/tig/back-basics-multi-factor-authentication" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline flex items-center"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    NIST: Back to Basics - Multi-Factor Authentication
                  </a>
                </li>
                <li>
                  <a 
                    href="https://auth0.com/intro-to-iam/what-is-mfa" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline flex items-center"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Auth0: Introduction to Multi-Factor Authentication
                  </a>
                </li>
                <li>
                  <a 
                    href="https://owasp.org/www-community/Vulnerability_Scanning_Tools" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline flex items-center"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    OWASP Authentication Best Practices
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