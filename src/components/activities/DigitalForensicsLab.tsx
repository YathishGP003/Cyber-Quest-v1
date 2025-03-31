"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CheckCircle, HardDrive, FileSearch, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DigitalForensicsLabProps {
  activity: any;
  userId: string;
  progress: any;
}

export default function DigitalForensicsLab({ activity, userId, progress }: DigitalForensicsLabProps) {
  const router = useRouter();
  const [isCompleted, setIsCompleted] = useState(progress?.isCompleted || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("diskImage");
  const [showSolutions, setShowSolutions] = useState<Record<string, boolean>>({});

  // Parse content
  const content = typeof activity.content === 'string'
    ? JSON.parse(activity.content)
    : activity.content;

  const handleToggleSolution = (id: string) => {
    setShowSolutions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSubmitLab = async () => {
    try {
      setIsSubmitting(true);
      
      // Calculate a basic score
      const score = 85;
      
      // Update activity progress in the database
      const response = await fetch(`/api/activities/${activity.id}/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isCompleted: true,
          score: score,
          pointsEarned: Math.round((score / 100) * activity.points)
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
  
  // If already completed, show the completed state
  if (isCompleted) {
    return (
      <div className="text-center py-6">
        <div className="mb-4">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Lab Completed</h2>
        <p className="text-gray-400 mb-6">You've successfully completed the Digital Forensics Lab.</p>
        
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
        <h2 className="text-2xl font-bold">{content.title || "Digital Forensics Lab"}</h2>
        <p className="text-gray-400 mt-1">{content.description || "Practice digital forensics techniques and evidence collection."}</p>
      </div>

      <Tabs defaultValue="diskImage" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="diskImage" className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" /> Disk Imaging
          </TabsTrigger>
          <TabsTrigger value="dataRecovery" className="flex items-center gap-2">
            <FileSearch className="h-4 w-4" /> Data Recovery
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> Timeline Analysis
          </TabsTrigger>
        </TabsList>

        {/* Disk Imaging Tab */}
        <TabsContent value="diskImage" className="space-y-6">
          <Card className="bg-black/30">
            <CardHeader>
              <CardTitle>Disk Imaging Exercise</CardTitle>
              <CardDescription>
                Extract and analyze disk images to collect digital evidence.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 space-y-4">
                <p>This exercise simulates creating and analyzing a forensic disk image.</p>
                
                <div className="bg-black/20 p-3 rounded-md font-mono text-sm">
                  $ sudo dd if=/dev/sda of=evidence01.img bs=4M<br />
                  2048+0 records in<br />
                  2048+0 records out<br />
                  8589934592 bytes (8.6 GB, 8.0 GiB) copied, 95.4367 s, 90.0 MB/s
                </div>
                
                <Button 
                  variant="link" 
                  onClick={() => handleToggleSolution("diskImage")}
                  className="p-0 h-auto font-normal text-blue-400"
                >
                  {showSolutions["diskImage"] ? "Hide Solution" : "Show Solution"}
                </Button>
                
                {showSolutions["diskImage"] && (
                  <div className="mt-2 p-4 bg-black/40 rounded-md">
                    <h3 className="font-medium text-lg mb-2">Disk Imaging Solution</h3>
                    <p className="mb-2">For proper forensic disk imaging:</p>
                    <ol className="list-decimal pl-5 space-y-2">
                      <li>Always use a write blocker to prevent accidental modification of evidence</li>
                      <li>Compute and verify hash values before and after imaging</li>
                      <li>Document the chain of custody for all evidence handling</li>
                      <li>Use forensically sound tools like 'dd', 'FTK Imager', or 'EnCase'</li>
                      <li>Store images on sterile media</li>
                    </ol>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Recovery Tab */}
        <TabsContent value="dataRecovery" className="space-y-6">
          <Card className="bg-black/30">
            <CardHeader>
              <CardTitle>Data Recovery Challenge</CardTitle>
              <CardDescription>
                Recover deleted files and analyze file fragments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 space-y-4">
                <p>In this exercise, you'll recover deleted files using file carving techniques.</p>
                
                <div className="bg-black/20 p-3 rounded-md font-mono text-sm">
                  $ foremost -t jpg,pdf,doc -i evidence01.img -o recovered_files<br />
                  Processing: evidence01.img<br />
                  |*****************************************|<br />
                  File: evidence01.img<br />
                  Start: Thu Mar 21 19:24:37 2023<br />
                  Length: 8 GB (8589934592 bytes)<br />
                  Num Files: 127<br />
                  Recovered: 42 JPG, 15 PDF, 8 DOC
                </div>
                
                <Button 
                  variant="link" 
                  onClick={() => handleToggleSolution("dataRecovery")}
                  className="p-0 h-auto font-normal text-blue-400"
                >
                  {showSolutions["dataRecovery"] ? "Hide Solution" : "Show Solution"}
                </Button>
                
                {showSolutions["dataRecovery"] && (
                  <div className="mt-2 p-4 bg-black/40 rounded-md">
                    <h3 className="font-medium text-lg mb-2">Data Recovery Solution</h3>
                    <p className="mb-2">Data recovery best practices:</p>
                    <ol className="list-decimal pl-5 space-y-2">
                      <li>Look for file headers (magic numbers) to identify file types regardless of extension</li>
                      <li>Extract file metadata to establish timeline and ownership</li>
                      <li>Examine slack space and unallocated clusters for remnants of deleted files</li>
                      <li>Use multiple tools (foremost, scalpel, PhotoRec) for comprehensive recovery</li>
                      <li>Analyze file fragments to reconstruct partial evidence</li>
                    </ol>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Analysis Tab */}
        <TabsContent value="timeline" className="space-y-6">
          <Card className="bg-black/30">
            <CardHeader>
              <CardTitle>Timeline Construction</CardTitle>
              <CardDescription>
                Build a chronological timeline of system events.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 space-y-4">
                <p>Create a forensic timeline using filesystem metadata and log files.</p>
                
                <div className="bg-black/20 p-3 rounded-md font-mono text-sm">
                  $ log2timeline.py --parsers 'winreg,winevt,winevtx,webhist' timeline.plaso evidence01.img<br />
                  $ psort.py -o l2tcsv -w timeline.csv timeline.plaso<br />
                  Processing completed. 3842 events extracted.
                </div>
                
                <Button 
                  variant="link" 
                  onClick={() => handleToggleSolution("timeline")}
                  className="p-0 h-auto font-normal text-blue-400"
                >
                  {showSolutions["timeline"] ? "Hide Solution" : "Show Solution"}
                </Button>
                
                {showSolutions["timeline"] && (
                  <div className="mt-2 p-4 bg-black/40 rounded-md">
                    <h3 className="font-medium text-lg mb-2">Timeline Analysis Solution</h3>
                    <p className="mb-2">For effective timeline construction and analysis:</p>
                    <ol className="list-decimal pl-5 space-y-2">
                      <li>Correlate file system timestamps (MAC times) with application logs</li>
                      <li>Account for timezone differences and timestamp manipulation</li>
                      <li>Look for gaps or inconsistencies that may indicate tampering</li>
                      <li>Focus on key timeframes surrounding the incident</li>
                      <li>Document chain of evidence and all analysis steps</li>
                      <li>Use tools like Plaso (log2timeline) for super-timeline creation</li>
                    </ol>
                  </div>
                )}
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