"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CheckCircle, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ReadingContent {
  title: string;
  sections: {
    heading: string;
    content: string;
  }[];
}

interface ReadingActivityProps {
  activity: any;
  userId: string;
  progress: any;
}

export default function ReadingActivity({ activity, userId, progress }: ReadingActivityProps) {
  const router = useRouter();
  const [isCompleted, setIsCompleted] = useState(progress?.isCompleted || false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Parse content
  const content: ReadingContent = typeof activity.content === 'string'
    ? JSON.parse(activity.content)
    : activity.content || { 
      title: "Reading Content", 
      sections: [{ 
        heading: "Sample Content", 
        content: "This reading activity has not been configured with content yet." 
      }] 
    };
  
  // Track progress
  useEffect(() => {
    if (progress?.isCompleted) {
      setIsCompleted(true);
    }
  }, [progress]);
  
  const totalSections = content.sections.length;
  const currentSection = content.sections[currentSectionIndex];
  
  const handleNextSection = () => {
    if (currentSectionIndex < totalSections - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      window.scrollTo(0, 0);
    }
  };
  
  const handlePreviousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
      window.scrollTo(0, 0);
    }
  };
  
  const handleCompleteReading = async () => {
    try {
      setIsSubmitting(true);
      
      console.log("Completing reading activity:", activity.id);
      
      // Ensure activity ID is valid
      if (!activity.id) {
        throw new Error("Missing activity ID");
      }
      
      const payload = {
        isCompleted: true,
        score: 100,
        pointsEarned: activity.points,
      };
      
      console.log("Sending payload:", payload);
      
      // Update activity progress in the database
      const response = await fetch(`/api/activities/${activity.id}/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        // Try to get error details
        let errorMessage = `${response.status} ${response.statusText}`;
        try {
          const errorText = await response.text();
          console.error("Error response:", errorText);
          errorMessage = errorText || errorMessage;
        } catch (e) {
          console.error("Could not read error response", e);
        }
        
        throw new Error(`Failed to update progress: ${errorMessage}`);
      }
      
      // Get the response data
      const data = await response.json();
      console.log("Success response:", data);
      
      setIsCompleted(true);
      
      // Force reload the page rather than just refreshing React data
      window.location.reload();
    } catch (error) {
      console.error("Error completing reading:", error);
      alert("Failed to save your progress. Please try again.");
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
        <h2 className="text-2xl font-bold mb-2">Reading Completed</h2>
        <p className="text-white/85 mb-6">You've completed this reading activity.</p>
        
        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={() => setIsCompleted(false)}>
            Review Content
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
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-white/85">
          Section {currentSectionIndex + 1} of {totalSections}
        </div>
        
        {!isCompleted && (
          <Button 
            variant="outline" 
            size="sm"
            disabled={currentSectionIndex < totalSections - 1}
            onClick={handleCompleteReading}
          >
            {isSubmitting ? "Marking as completed..." : "Mark as Completed"}
          </Button>
        )}
      </div>
      
      <div className="prose prose-invert max-w-none text-white">
        <h2 className="text-2xl font-bold mb-4 text-white">{currentSection.heading}</h2>
        <div className="text-white" dangerouslySetInnerHTML={{ __html: currentSection.content }} />
      </div>
      
      <div className="flex justify-between pt-6">
        <Button 
          variant="outline" 
          onClick={handlePreviousSection}
          disabled={currentSectionIndex === 0}
        >
          Previous Section
        </Button>
        
        {currentSectionIndex === totalSections - 1 ? (
          <Button 
            onClick={handleCompleteReading} 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Completing..." : "Complete Reading"}
          </Button>
        ) : (
          <Button onClick={handleNextSection}>
            Next Section
          </Button>
        )}
      </div>
    </div>
  );
} 