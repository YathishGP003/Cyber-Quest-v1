"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CheckCircle, Mail, AlertTriangle, Info, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

interface SocialEngineeringLabProps {
  activity: any;
  userId: string;
  progress: any;
}

interface EmailScenario {
  id: string;
  title: string;
  sender: string;
  subject: string;
  body: string;
  attachments?: { name: string; size: string }[];
  isPhishing: boolean;
  redFlags?: string[];
  explanation: string;
}

interface DeepfakeScenario {
  id: string;
  title: string;
  videoUrl: string;
  description: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface VoicePhishingScenario {
  id: string;
  title: string;
  audioUrl: string;
  transcript: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface SocialMediaScenario {
  id: string;
  title: string;
  platform: string;
  description: string;
  imageUrl: string;
  risks: string[];
  securitySettings: { setting: string; recommended: string }[];
}

export default function SocialEngineeringLab({ activity, userId, progress }: SocialEngineeringLabProps) {
  const router = useRouter();
  const [isCompleted, setIsCompleted] = useState(progress?.isCompleted || false);
  const [activeTab, setActiveTab] = useState("emails");
  const [emailAnswers, setEmailAnswers] = useState<Record<string, boolean>>({});
  const [deepfakeAnswers, setDeepfakeAnswers] = useState<Record<string, string>>({});
  const [voicePhishingAnswers, setVoicePhishingAnswers] = useState<Record<string, string>>({});
  const [socialMediaChecklist, setSocialMediaChecklist] = useState<Record<string, boolean>>({});
  const [showSolutions, setShowSolutions] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<Record<string, any>>({});
  const [showResults, setShowResults] = useState(false);

  // Parse content
  const content = typeof activity.content === 'string'
    ? JSON.parse(activity.content)
    : activity.content;

  const emailScenarios: EmailScenario[] = content.emailScenarios || [];
  const deepfakeScenarios: DeepfakeScenario[] = content.deepfakeScenarios || [];
  const voicePhishingScenarios: VoicePhishingScenario[] = content.voicePhishingScenarios || [];
  const socialMediaScenarios: SocialMediaScenario[] = content.socialMediaScenarios || [];

  const handleToggleSolution = (id: string) => {
    setShowSolutions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleEmailAnswer = (id: string, isPhishing: boolean) => {
    setEmailAnswers(prev => ({
      ...prev,
      [id]: isPhishing
    }));
  };

  const handleDeepfakeAnswer = (id: string, answer: string) => {
    setDeepfakeAnswers(prev => ({
      ...prev,
      [id]: answer
    }));
  };

  const handleVoicePhishingAnswer = (id: string, answer: string) => {
    setVoicePhishingAnswers(prev => ({
      ...prev,
      [id]: answer
    }));
  };

  const handleSocialMediaCheck = (scenarioId: string, settingId: string, checked: boolean) => {
    setSocialMediaChecklist(prev => ({
      ...prev,
      [`${scenarioId}-${settingId}`]: checked
    }));
  };

  const calculateScore = () => {
    let totalPoints = 0;
    let earnedPoints = 0;

    // Score email section (40% of total)
    const emailWeight = 0.4;
    const totalEmailPoints = emailScenarios.length;
    let earnedEmailPoints = 0;

    emailScenarios.forEach(scenario => {
      if (emailAnswers[scenario.id] === scenario.isPhishing) {
        earnedEmailPoints++;
      }
    });

    // Score deepfake section (20% of total)
    const deepfakeWeight = 0.2;
    const totalDeepfakePoints = deepfakeScenarios.length;
    let earnedDeepfakePoints = 0;

    deepfakeScenarios.forEach(scenario => {
      if (deepfakeAnswers[scenario.id] === scenario.correctAnswer) {
        earnedDeepfakePoints++;
      }
    });

    // Score voice phishing section (20% of total)
    const voicePhishingWeight = 0.2;
    const totalVoicePhishingPoints = voicePhishingScenarios.length;
    let earnedVoicePhishingPoints = 0;

    voicePhishingScenarios.forEach(scenario => {
      if (voicePhishingAnswers[scenario.id] === scenario.correctAnswer) {
        earnedVoicePhishingPoints++;
      }
    });

    // Score social media section (20% of total)
    const socialMediaWeight = 0.2;
    const totalSocialMediaChecks = socialMediaScenarios.reduce((total, scenario) => 
      total + scenario.securitySettings.length, 0);
    let earnedSocialMediaPoints = 0;

    socialMediaScenarios.forEach(scenario => {
      scenario.securitySettings.forEach((setting, index) => {
        if (socialMediaChecklist[`${scenario.id}-${index}`]) {
          earnedSocialMediaPoints++;
        }
      });
    });

    // Calculate weighted score components
    const emailScore = totalEmailPoints > 0 
      ? (earnedEmailPoints / totalEmailPoints) * emailWeight * 100 
      : 0;
    
    const deepfakeScore = totalDeepfakePoints > 0 
      ? (earnedDeepfakePoints / totalDeepfakePoints) * deepfakeWeight * 100 
      : 0;
    
    const voicePhishingScore = totalVoicePhishingPoints > 0 
      ? (earnedVoicePhishingPoints / totalVoicePhishingPoints) * voicePhishingWeight * 100 
      : 0;
    
    const socialMediaScore = totalSocialMediaChecks > 0 
      ? (earnedSocialMediaPoints / totalSocialMediaChecks) * socialMediaWeight * 100 
      : 0;

    // Total score
    const totalScore = Math.round(emailScore + deepfakeScore + voicePhishingScore + socialMediaScore);

    return {
      totalScore,
      emailScore: Math.round(emailScore / emailWeight),
      deepfakeScore: Math.round(deepfakeScore / deepfakeWeight),
      voicePhishingScore: Math.round(voicePhishingScore / voicePhishingWeight),
      socialMediaScore: Math.round(socialMediaScore / socialMediaWeight)
    };
  };

  const handleSubmitLab = async () => {
    try {
      setIsSubmitting(true);

      const scoreResults = calculateScore();
      setScore(scoreResults.totalScore);
      setResults(scoreResults);

      // Success threshold (70%)
      const passed = scoreResults.totalScore >= 70;

      // Prepare answers for submission
      const submissionData = {
        emails: emailAnswers,
        deepfakes: deepfakeAnswers,
        voicePhishing: voicePhishingAnswers,
        socialMedia: socialMediaChecklist
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
    return (
      <div className="space-y-6">
        <div className="text-center p-4">
          <div className="mb-4">
            {score >= 70 ? (
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            ) : (
              <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto" />
            )}
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Lab Results</h2>
          <p className="text-gray-400 mb-4">
            {score >= 70 
              ? "Congratulations! You've successfully completed the Social Engineering Lab." 
              : "You need a score of at least 70% to pass this lab. Review the material and try again."}
          </p>
          
          <div className="text-2xl font-bold mb-6">
            Total Score: {score}%
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <Card className="bg-black/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Email Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{results.emailScore}%</div>
              </CardContent>
            </Card>
            
            <Card className="bg-black/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Deepfake Detection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{results.deepfakeScore}%</div>
              </CardContent>
            </Card>
            
            <Card className="bg-black/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Voice Phishing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{results.voicePhishingScore}%</div>
              </CardContent>
            </Card>
            
            <Card className="bg-black/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Social Media Security</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{results.socialMediaScore}%</div>
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
        <h2 className="text-2xl font-bold">{content.title || "Social Engineering Lab"}</h2>
        <p className="text-gray-400 mt-1">{content.description || "Practice identifying and responding to social engineering attacks."}</p>
      </div>

      <Tabs defaultValue="emails" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="emails" className="flex items-center gap-2">
            <Mail className="h-4 w-4" /> Emails
          </TabsTrigger>
          <TabsTrigger value="deepfakes">Deepfakes</TabsTrigger>
          <TabsTrigger value="voicePhishing">Voice Phishing</TabsTrigger>
          <TabsTrigger value="socialMedia">Social Media</TabsTrigger>
        </TabsList>

        {/* Email Analysis Tab */}
        <TabsContent value="emails" className="space-y-6">
          <div className="mb-4">
            <h3 className="text-xl font-semibold mb-2">Email Phishing Analysis</h3>
            <p className="text-gray-400">Analyze the following emails and determine whether they are legitimate or phishing attempts.</p>
          </div>

          {emailScenarios.map((scenario) => (
            <Card key={scenario.id} className="mb-4 bg-black/30">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">{scenario.subject}</CardTitle>
                    <CardDescription>From: {scenario.sender}</CardDescription>
                  </div>
                  {emailAnswers[scenario.id] !== undefined && (
                    <Badge variant={
                      emailAnswers[scenario.id] === scenario.isPhishing ? "default" : "destructive"
                    }>
                      {emailAnswers[scenario.id] === scenario.isPhishing ? "Correct" : "Incorrect"}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert max-w-none">
                  <div className="p-4 bg-black/20 rounded-md whitespace-pre-line">
                    {scenario.body}
                  </div>
                  
                  {scenario.attachments && scenario.attachments.length > 0 && (
                    <div className="mt-4">
                      <p className="font-semibold">Attachments:</p>
                      <ul className="mt-2">
                        {scenario.attachments.map((attachment, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span>{attachment.name}</span>
                            <span className="text-xs text-gray-400">({attachment.size})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <p className="mb-2 font-medium">Is this a phishing email?</p>
                  <div className="flex space-x-4">
                    <Button 
                      variant={emailAnswers[scenario.id] === true ? "default" : "outline"}
                      onClick={() => handleEmailAnswer(scenario.id, true)}
                    >
                      Yes, it's phishing
                    </Button>
                    <Button 
                      variant={emailAnswers[scenario.id] === false ? "default" : "outline"}
                      onClick={() => handleEmailAnswer(scenario.id, false)}
                    >
                      No, it's legitimate
                    </Button>
                  </div>
                </div>

                {/* Show Solution Button */}
                <div className="mt-4">
                  <Button 
                    variant="link" 
                    onClick={() => handleToggleSolution(scenario.id)}
                    className="p-0 h-auto font-normal text-blue-400"
                  >
                    {showSolutions[scenario.id] ? "Hide Solution" : "Show Solution"}
                  </Button>
                </div>

                {showSolutions[scenario.id] && (
                  <div className="mt-2 p-4 bg-black/40 rounded-md">
                    <p className="font-semibold mb-2">
                      This is {scenario.isPhishing ? "a phishing email" : "a legitimate email"}.
                    </p>
                    <p className="mb-2">{scenario.explanation}</p>
                    
                    {scenario.redFlags && scenario.redFlags.length > 0 && (
                      <div>
                        <p className="font-semibold mt-2">Red Flags:</p>
                        <ul className="list-disc pl-5">
                          {scenario.redFlags.map((flag, idx) => (
                            <li key={idx}>{flag}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Deepfake Detection Tab */}
        <TabsContent value="deepfakes" className="space-y-6">
          <div className="mb-4">
            <h3 className="text-xl font-semibold mb-2">Deepfake Detection Challenge</h3>
            <p className="text-gray-400">Analyze the following video clips and determine if they are genuine or deepfakes.</p>
          </div>

          {deepfakeScenarios.map((scenario) => (
            <Card key={scenario.id} className="mb-4 bg-black/30">
              <CardHeader>
                <CardTitle className="text-lg">{scenario.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-black/50 mb-4 flex items-center justify-center">
                  {/* Video player would be here - for the prototype we'll use a placeholder */}
                  <div className="text-center p-4">
                    <Info className="h-12 w-12 mx-auto mb-2 text-blue-400" />
                    <p>{scenario.description}</p>
                  </div>
                </div>

                <RadioGroup 
                  value={deepfakeAnswers[scenario.id]} 
                  onValueChange={(value) => handleDeepfakeAnswer(scenario.id, value)}
                >
                  {scenario.options.map((option, idx) => (
                    <div key={idx} className="flex items-center space-x-2 mt-2">
                      <RadioGroupItem value={option} id={`${scenario.id}-option-${idx}`} />
                      <Label htmlFor={`${scenario.id}-option-${idx}`}>{option}</Label>
                    </div>
                  ))}
                </RadioGroup>

                {/* Show Solution Button */}
                <div className="mt-4">
                  <Button 
                    variant="link" 
                    onClick={() => handleToggleSolution(scenario.id)}
                    className="p-0 h-auto font-normal text-blue-400"
                  >
                    {showSolutions[scenario.id] ? "Hide Solution" : "Show Solution"}
                  </Button>
                </div>

                {showSolutions[scenario.id] && (
                  <div className="mt-2 p-4 bg-black/40 rounded-md">
                    <p className="font-semibold mb-2">
                      Correct answer: {scenario.correctAnswer}
                    </p>
                    <p>{scenario.explanation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Voice Phishing Tab */}
        <TabsContent value="voicePhishing" className="space-y-6">
          <div className="mb-4">
            <h3 className="text-xl font-semibold mb-2">Voice Phishing Scenarios</h3>
            <p className="text-gray-400">Listen to these calls and identify voice phishing (vishing) attempts.</p>
          </div>

          {voicePhishingScenarios.map((scenario) => (
            <Card key={scenario.id} className="mb-4 bg-black/30">
              <CardHeader>
                <CardTitle className="text-lg">{scenario.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Audio player would be here */}
                <div className="bg-black/50 p-4 rounded-md mb-4">
                  <p className="font-medium mb-2">Call Transcript:</p>
                  <p className="whitespace-pre-line text-sm">{scenario.transcript}</p>
                </div>

                <p className="font-medium mb-2">{scenario.question}</p>
                <RadioGroup 
                  value={voicePhishingAnswers[scenario.id]} 
                  onValueChange={(value) => handleVoicePhishingAnswer(scenario.id, value)}
                >
                  {scenario.options.map((option, idx) => (
                    <div key={idx} className="flex items-center space-x-2 mt-2">
                      <RadioGroupItem value={option} id={`${scenario.id}-voice-option-${idx}`} />
                      <Label htmlFor={`${scenario.id}-voice-option-${idx}`}>{option}</Label>
                    </div>
                  ))}
                </RadioGroup>

                {/* Show Solution Button */}
                <div className="mt-4">
                  <Button 
                    variant="link" 
                    onClick={() => handleToggleSolution(scenario.id)}
                    className="p-0 h-auto font-normal text-blue-400"
                  >
                    {showSolutions[scenario.id] ? "Hide Solution" : "Show Solution"}
                  </Button>
                </div>

                {showSolutions[scenario.id] && (
                  <div className="mt-2 p-4 bg-black/40 rounded-md">
                    <p className="font-semibold mb-2">
                      Correct answer: {scenario.correctAnswer}
                    </p>
                    <p>{scenario.explanation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Social Media Security Tab */}
        <TabsContent value="socialMedia" className="space-y-6">
          <div className="mb-4">
            <h3 className="text-xl font-semibold mb-2">Social Media Security Audit</h3>
            <p className="text-gray-400">Analyze these social media profiles and identify security risks and recommended settings.</p>
          </div>

          {socialMediaScenarios.map((scenario) => (
            <Card key={scenario.id} className="mb-4 bg-black/30">
              <CardHeader>
                <CardTitle className="text-lg">{scenario.title}</CardTitle>
                <CardDescription>{scenario.platform}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="aspect-square bg-black/50 relative mb-4">
                      {/* Profile image placeholder */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Shield className="h-12 w-12 text-blue-400" />
                      </div>
                    </div>
                    <p>{scenario.description}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Security Risks:</h4>
                    <ul className="list-disc pl-5 mb-4">
                      {scenario.risks.map((risk, idx) => (
                        <li key={idx}>{risk}</li>
                      ))}
                    </ul>
                    
                    <h4 className="font-medium mb-2">Recommended Security Settings:</h4>
                    <div className="space-y-2">
                      {scenario.securitySettings.map((setting, idx) => (
                        <div key={idx} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`setting-${scenario.id}-${idx}`}
                            className="mr-2"
                            checked={!!socialMediaChecklist[`${scenario.id}-${idx}`]}
                            onChange={(e) => handleSocialMediaCheck(scenario.id, idx.toString(), e.target.checked)}
                          />
                          <Label htmlFor={`setting-${scenario.id}-${idx}`} className="font-normal">
                            {setting.setting}: <span className="text-green-400">{setting.recommended}</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Show Solution Button */}
                <div className="mt-4">
                  <Button 
                    variant="link" 
                    onClick={() => handleToggleSolution(scenario.id)}
                    className="p-0 h-auto font-normal text-blue-400"
                  >
                    {showSolutions[scenario.id] ? "Hide Solution" : "Show Solution"}
                  </Button>
                </div>

                {showSolutions[scenario.id] && (
                  <div className="mt-2 p-4 bg-black/40 rounded-md">
                    <p className="font-semibold mb-2">
                      All security settings should be applied for maximum protection.
                    </p>
                    <p>Implementing these changes would significantly reduce the security risks identified.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <div className="flex justify-center mt-8">
        <Button onClick={handleSubmitLab} disabled={isSubmitting} className="w-full md:w-auto">
          {isSubmitting ? "Submitting..." : "Submit Lab"}
        </Button>
      </div>
    </div>
  );
} 