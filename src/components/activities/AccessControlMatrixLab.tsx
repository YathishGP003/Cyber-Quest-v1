"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CheckCircle, Terminal, ExternalLink, Shield, Lock, User, FileText, Database, Settings, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface AccessControlMatrixLabProps {
  activity: any;
  userId: string;
  progress: any;
}

interface User {
  id: string;
  name: string;
  role: string;
}

interface Resource {
  id: string;
  name: string;
  type: string;
  icon: JSX.Element;
}

interface Permission {
  userId: string;
  resourceId: string;
  read: boolean;
  write: boolean;
  execute: boolean;
  delete: boolean;
}

export default function AccessControlMatrixLab({ activity, userId, progress }: AccessControlMatrixLabProps) {
  const router = useRouter();
  const [isCompleted, setIsCompleted] = useState(progress?.isCompleted || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("instructions");
  
  // Lab-specific state
  const [users, setUsers] = useState<User[]>([
    { id: "user1", name: "Admin User", role: "admin" },
    { id: "user2", name: "Regular User", role: "user" },
    { id: "user3", name: "Guest User", role: "guest" },
    { id: "user4", name: "Manager", role: "manager" },
  ]);
  
  const [resources, setResources] = useState<Resource[]>([
    { id: "res1", name: "User Database", type: "database", icon: <Database className="h-4 w-4" /> },
    { id: "res2", name: "Config Files", type: "file", icon: <FileText className="h-4 w-4" /> },
    { id: "res3", name: "System Settings", type: "settings", icon: <Settings className="h-4 w-4" /> },
    { id: "res4", name: "Public Documents", type: "document", icon: <FileText className="h-4 w-4" /> },
  ]);
  
  const [permissions, setPermissions] = useState<Permission[]>([
    // Admin permissions
    { userId: "user1", resourceId: "res1", read: true, write: true, execute: true, delete: true },
    { userId: "user1", resourceId: "res2", read: true, write: true, execute: true, delete: true },
    { userId: "user1", resourceId: "res3", read: true, write: true, execute: true, delete: true },
    { userId: "user1", resourceId: "res4", read: true, write: true, execute: true, delete: true },
    
    // Regular user permissions
    { userId: "user2", resourceId: "res1", read: false, write: false, execute: false, delete: false },
    { userId: "user2", resourceId: "res2", read: true, write: false, execute: false, delete: false },
    { userId: "user2", resourceId: "res3", read: false, write: false, execute: false, delete: false },
    { userId: "user2", resourceId: "res4", read: true, write: true, execute: false, delete: false },
    
    // Guest permissions
    { userId: "user3", resourceId: "res1", read: false, write: false, execute: false, delete: false },
    { userId: "user3", resourceId: "res2", read: false, write: false, execute: false, delete: false },
    { userId: "user3", resourceId: "res3", read: false, write: false, execute: false, delete: false },
    { userId: "user3", resourceId: "res4", read: true, write: false, execute: false, delete: false },
    
    // Manager permissions
    { userId: "user4", resourceId: "res1", read: true, write: false, execute: false, delete: false },
    { userId: "user4", resourceId: "res2", read: true, write: true, execute: false, delete: false },
    { userId: "user4", resourceId: "res3", read: true, write: false, execute: false, delete: false },
    { userId: "user4", resourceId: "res4", read: true, write: true, execute: false, delete: true },
  ]);
  
  const [activeUser, setActiveUser] = useState<string>("user2");
  const [accessAttempts, setAccessAttempts] = useState<Array<{
    userId: string;
    resourceId: string;
    action: "read" | "write" | "execute" | "delete";
    success: boolean;
    timestamp: Date;
  }>>([]);
  
  const [securityIssues, setSecurityIssues] = useState<Array<{
    id: string;
    description: string;
    severity: "low" | "medium" | "high";
    fixed: boolean;
  }>>([
    {
      id: "issue1",
      description: "Guest users should not have write access to any resources",
      severity: "medium",
      fixed: false
    },
    {
      id: "issue2",
      description: "Regular users should not have delete permissions on Public Documents",
      severity: "low",
      fixed: false
    },
    {
      id: "issue3",
      description: "Principle of least privilege: Manager role has excessive permissions",
      severity: "medium",
      fixed: false
    },
    {
      id: "issue4",
      description: "Database access should be restricted to admin only",
      severity: "high",
      fixed: false
    }
  ]);
  
  // Extracted content from activity
  const content = typeof activity.content === 'string'
    ? JSON.parse(activity.content)
    : activity.content;

  // Update permission
  const togglePermission = (userId: string, resourceId: string, permission: "read" | "write" | "execute" | "delete") => {
    setPermissions(permissions.map(p => {
      if (p.userId === userId && p.resourceId === resourceId) {
        return {
          ...p,
          [permission]: !p[permission]
        };
      }
      return p;
    }));
    
    // Check if security issues are fixed
    checkSecurityIssues();
  };
  
  // Check if security issues are fixed
  const checkSecurityIssues = () => {
    const updatedIssues = [...securityIssues];
    
    // Issue 1: Guest users should not have write access
    const guestWritePermissions = permissions.filter(
      p => users.find(u => u.id === p.userId)?.role === "guest" && p.write
    );
    updatedIssues[0].fixed = guestWritePermissions.length === 0;
    
    // Issue 2: Regular users should not have delete permissions on Public Documents
    const regularUserDeleteDocs = permissions.find(
      p => p.userId === "user2" && p.resourceId === "res4" && p.delete
    );
    updatedIssues[1].fixed = !regularUserDeleteDocs;
    
    // Issue 3: Manager has excessive permissions
    const managerExecutePermissions = permissions.filter(
      p => p.userId === "user4" && p.execute
    );
    updatedIssues[2].fixed = managerExecutePermissions.length === 0;
    
    // Issue 4: Database access should be restricted to admin only
    const nonAdminDbAccess = permissions.filter(
      p => p.resourceId === "res1" && 
           p.userId !== "user1" && 
           (p.write || p.execute || p.delete)
    );
    updatedIssues[3].fixed = nonAdminDbAccess.length === 0;
    
    setSecurityIssues(updatedIssues);
  };
  
  // Attempt to access a resource
  const attemptAccess = (resourceId: string, action: "read" | "write" | "execute" | "delete") => {
    // Find user and resource
    const user = users.find(u => u.id === activeUser);
    const resource = resources.find(r => r.id === resourceId);
    
    if (!user || !resource) return;
    
    // Find permission
    const permission = permissions.find(p => p.userId === activeUser && p.resourceId === resourceId);
    
    if (!permission) return;
    
    // Check if access is allowed
    const success = permission[action];
    
    // Record the attempt
    setAccessAttempts([
      {
        userId: activeUser,
        resourceId,
        action,
        success,
        timestamp: new Date()
      },
      ...accessAttempts.slice(0, 9) // Keep only latest 10 attempts
    ]);
    
    // Show feedback
    if (success) {
      toast.success(`Access granted: ${user.name} can ${action} ${resource.name}`);
    } else {
      toast.error(`Access denied: ${user.name} cannot ${action} ${resource.name}`);
    }
  };

  // Handle form submission
  const handleSubmitLab = async () => {
    try {
      // Only allow submission if all security issues are fixed
      const allFixed = securityIssues.every(issue => issue.fixed);
      
      if (!allFixed) {
        toast.error("You need to fix all security issues before completing the lab");
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
          answers: { permissions, securityIssues },
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
        <p className="text-white mb-6">You've successfully completed the Access Control Matrix lab.</p>
        
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
            <h2 className="text-2xl font-bold text-white">Access Control Matrix Simulation</h2>
            <p className="text-white">
              This lab simulates an access control matrix, a fundamental security model that defines the 
              permissions of subjects (users) on objects (resources).
            </p>
            <h3 className="text-xl font-semibold text-white mt-4">Objectives</h3>
            <ul className="list-disc pl-5 text-white">
              <li>Understand how access control matrices work in cybersecurity</li>
              <li>Practice configuring proper access rights based on the principle of least privilege</li>
              <li>Identify and fix security issues in an access control implementation</li>
              <li>Test access control enforcement by simulating access attempts</li>
            </ul>
            <p className="text-white mt-4">
              Your task is to configure appropriate permissions for each user role and fix the identified 
              security issues in the access control implementation.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="lab" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-black/30 border-blue-500/20">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Shield className="h-5 w-5 mr-2 text-blue-500" />
                  Access Control Matrix
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Configure permissions for each user and resource
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px] text-white">User / Resource</TableHead>
                        {resources.map(resource => (
                          <TableHead key={resource.id} className="text-white">
                            <div className="flex flex-col items-center">
                              <div className="flex items-center space-x-1">
                                {resource.icon}
                                <span>{resource.name}</span>
                              </div>
                              <span className="text-xs text-gray-400">{resource.type}</span>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map(user => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium text-white">
                            <div className="flex flex-col">
                              <span className="flex items-center">
                                <User className="h-4 w-4 mr-1" />
                                {user.name}
                              </span>
                              <span className="text-xs text-gray-400">{user.role}</span>
                            </div>
                          </TableCell>
                          
                          {resources.map(resource => (
                            <TableCell key={`${user.id}-${resource.id}`} className="text-center">
                              <div className="flex flex-col space-y-1">
                                {["read", "write", "execute", "delete"].map(action => {
                                  const permission = permissions.find(
                                    p => p.userId === user.id && p.resourceId === resource.id
                                  );
                                  
                                  return (
                                    <div key={`${user.id}-${resource.id}-${action}`} className="flex items-center space-x-1">
                                      <Checkbox 
                                        id={`${user.id}-${resource.id}-${action}`}
                                        checked={permission?.[action as keyof Permission] || false}
                                        onCheckedChange={() => togglePermission(
                                          user.id, 
                                          resource.id, 
                                          action as "read" | "write" | "execute" | "delete"
                                        )}
                                      />
                                      <Label 
                                        htmlFor={`${user.id}-${resource.id}-${action}`}
                                        className="text-xs text-white"
                                      >
                                        {action.charAt(0).toUpperCase() + action.slice(1)}
                                      </Label>
                                    </div>
                                  );
                                })}
                              </div>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
            
            <div className="space-y-6">
              <Card className="bg-black/30 border-amber-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
                    Security Issues
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Fix these security issues in the access control configuration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {securityIssues.map(issue => (
                      <li key={issue.id} className={`p-3 rounded-md flex items-start space-x-3 ${
                        issue.fixed 
                          ? "bg-green-900/20 border border-green-500/30" 
                          : issue.severity === "high"
                            ? "bg-red-900/20 border border-red-500/30"
                            : issue.severity === "medium"
                              ? "bg-amber-900/20 border border-amber-500/30"
                              : "bg-blue-900/20 border border-blue-500/30"
                      }`}>
                        <div className={`mt-0.5 ${
                          issue.fixed
                            ? "text-green-500"
                            : issue.severity === "high"
                              ? "text-red-500"
                              : issue.severity === "medium"
                                ? "text-amber-500"
                                : "text-blue-500"
                        }`}>
                          {issue.fixed 
                            ? <CheckCircle className="h-5 w-5" /> 
                            : <AlertCircle className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="text-white text-sm">{issue.description}</p>
                          <div className="mt-1 flex items-center space-x-2">
                            <Badge variant="outline" className={`
                              ${issue.severity === "high" 
                                ? "border-red-500/30 text-red-400" 
                                : issue.severity === "medium"
                                  ? "border-amber-500/30 text-amber-400"
                                  : "border-blue-500/30 text-blue-400"}
                            `}>
                              {issue.severity.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className={`
                              ${issue.fixed 
                                ? "border-green-500/30 text-green-400" 
                                : "border-gray-500/30 text-gray-400"}
                            `}>
                              {issue.fixed ? "FIXED" : "UNFIXED"}
                            </Badge>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="bg-black/30 border-purple-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <User className="h-5 w-5 mr-2 text-purple-500" />
                    Test Access Control
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Simulate access attempts as different users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="activeUser" className="text-white">Login as:</Label>
                      <select
                        id="activeUser"
                        value={activeUser}
                        onChange={(e) => setActiveUser(e.target.value)}
                        className="w-full rounded-md border border-gray-600 bg-black/50 px-3 py-2 text-white"
                      >
                        {users.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.role})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                      {resources.map(resource => (
                        <Card key={resource.id} className="bg-black/50 border-gray-700">
                          <CardHeader className="py-3">
                            <CardTitle className="text-sm flex items-center text-white">
                              {resource.icon}
                              <span className="ml-2">{resource.name}</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="py-2">
                            <div className="flex flex-wrap gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => attemptAccess(resource.id, "read")}
                                className="h-7 text-xs"
                              >
                                Read
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => attemptAccess(resource.id, "write")}
                                className="h-7 text-xs"
                              >
                                Write
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => attemptAccess(resource.id, "execute")}
                                className="h-7 text-xs"
                              >
                                Execute
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => attemptAccess(resource.id, "delete")}
                                className="h-7 text-xs"
                              >
                                Delete
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Access logs */}
          <Card className="bg-black/30 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-lg">Access Logs</CardTitle>
              <CardDescription className="text-gray-300">
                Recent access attempts and their results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {accessAttempts.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {accessAttempts.map((attempt, index) => {
                    const user = users.find(u => u.id === attempt.userId);
                    const resource = resources.find(r => r.id === attempt.resourceId);
                    
                    return (
                      <div 
                        key={index} 
                        className={`text-sm p-2 rounded ${
                          attempt.success 
                            ? "bg-green-900/20 border border-green-500/30" 
                            : "bg-red-900/20 border border-red-500/30"
                        }`}
                      >
                        <span className={attempt.success ? "text-green-400" : "text-red-400"}>
                          [{attempt.timestamp.toLocaleTimeString()}] 
                        </span>
                        <span className="text-white"> 
                          {user?.name} attempted to <strong>{attempt.action}</strong> {resource?.name}
                          - {attempt.success ? "ACCESS GRANTED" : "ACCESS DENIED"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">No access attempts yet</p>
              )}
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button 
              onClick={handleSubmitLab}
              disabled={isSubmitting || !securityIssues.every(issue => issue.fixed)}
            >
              {isSubmitting ? "Submitting..." : "Complete Lab"}
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="resources" className="space-y-4">
          <Card className="bg-black/30 border-blue-500/20">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <ExternalLink className="h-5 w-5 mr-2" />
                Additional Resources
              </CardTitle>
              <CardDescription className="text-gray-300">
                Learn more about access control and the principle of least privilege
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-white">
                <li>
                  <a 
                    href="https://owasp.org/www-project-top-ten/2017/A5_2017-Broken_Access_Control" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline flex items-center"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    OWASP Broken Access Control
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.nist.gov/publications/guide-attribute-based-access-control-abac-definition-and-considerations" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline flex items-center"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    NIST Guide to Attribute Based Access Control
                  </a>
                </li>
                <li>
                  <a 
                    href="https://csrc.nist.gov/publications/detail/sp/800-12/rev-1/final" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline flex items-center"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    NIST Computer Security Resource Center - Introduction to Information Security
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