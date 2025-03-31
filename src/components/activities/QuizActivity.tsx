"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

interface QuizContent {
  questions: Question[];
}

interface QuizActivityProps {
  activity: any;
  userId: string;
  progress: any;
}

export default function QuizActivity({ activity, userId, progress }: QuizActivityProps) {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  
  // Parse the content of the activity
  const content: QuizContent = typeof activity.content === 'string' 
    ? JSON.parse(activity.content) 
    : activity.content || { questions: [] };
  
  // Ensure each question has a unique ID
  const questions = content.questions.map((question, index) => {
    // If question doesn't have an id, assign one based on index
    if (!question.id) {
      return { ...question, id: `question-${index}` };
    }
    return question;
  });
  
  // Get the current question
  const currentQuestion = questions[currentQuestionIndex];
  
  // Debug logging
  console.log('Selected answers:', selectedAnswers);
  console.log('Number of selected answers:', Object.keys(selectedAnswers).length);
  console.log('Total questions:', questions.length);
  console.log('Current question ID:', currentQuestion?.id);
  
  const handleAnswerSelect = (value: string) => {
    const updatedAnswers = {
      ...selectedAnswers,
      [currentQuestion.id]: value
    };
    console.log('Updated answers:', updatedAnswers);
    setSelectedAnswers(updatedAnswers);
  };
  
  // Helper function to ensure answers are properly formatted
  const prepareAnswersForSubmission = (answers: Record<string, string>) => {
    // Ensure all answers exist and are properly formatted
    const formattedAnswers: Record<string, string> = {};
    
    // Format each question's answer
    questions.forEach(question => {
      // Use the selected answer or an empty string if not answered
      formattedAnswers[question.id] = answers[question.id] || '';
    });
    
    return formattedAnswers;
  };
  
  // Force enable submit button for debugging
  const canSubmitQuiz = currentQuestionIndex === questions.length - 1;
  
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const calculateScore = () => {
    let correctAnswers = 0;
    
    questions.forEach(question => {
      if (selectedAnswers[question.id] === question.correctAnswer) {
        correctAnswers++;
      }
    });
    
    return Math.round((correctAnswers / questions.length) * 100);
  };
  
  const handleSubmitQuiz = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // First check if the user exists in the database
      const userCheckResponse = await fetch('/api/user-check');
      
      if (!userCheckResponse.ok) {
        throw new Error('Failed to verify user account');
      }
      
      // Calculate the score
      const totalQuestions = questions.length;
      const correctAnswers = questions.filter(q => selectedAnswers[q.id] === q.correctAnswer).length;
      const scorePercent = Math.round((correctAnswers / totalQuestions) * 100);
      
      setScore(scorePercent);
      
      // Set result message based on score
      if (scorePercent >= 70) {
        setResultMessage(`Congratulations! You passed with ${scorePercent}% correct answers.`);
      } else {
        setResultMessage(`You scored ${scorePercent}%. You need at least 70% to pass.`);
      }
      
      // Format answers for submission
      const formattedAnswers: Record<string, { selected: string, correct: boolean }> = {};
      Object.keys(selectedAnswers).forEach(questionId => {
        formattedAnswers[questionId] = {
          selected: selectedAnswers[questionId],
          correct: questions.find(q => q.id === questionId)?.correctAnswer === selectedAnswers[questionId]
        };
      });
      
      // Prepare payload for the API
      const payload = {
        isCompleted: scorePercent >= 70, // Completed if score is 70% or higher
        score: scorePercent,
        pointsEarned: Math.round((scorePercent / 100) * activity.points),
        answers: formattedAnswers, // Pass as an object, the API will stringify it
      };
      
      console.log('Submitting quiz with activity ID:', activity.id);
      console.log('Payload:', payload);
      
      // Ensure activity ID is valid
      if (!activity.id) {
        throw new Error("Missing activity ID");
      }
      
      // Update activity progress in the database
      const response = await fetch(`/api/activities/${activity.id}/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        // Try to get error details
        let errorMessage = `${response.status} ${response.statusText}`;
        try {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          errorMessage = errorText || errorMessage;
        } catch (e) {
          console.error('Could not read error response', e);
        }
        
        throw new Error(`Failed to update progress: ${errorMessage}`);
      }
      
      // Get the response data
      const data = await response.json();
      console.log('Success response:', data);
      
      // Success! Show results
      setQuizCompleted(true);
      setShowResults(true);
      
      // Force reload the page after a short delay to show results first
      setTimeout(() => {
        window.location.reload();
      }, 5000); // 5-second delay to give users time to see their results
    } catch (error: any) {
      console.error("Error submitting quiz:", error);
      // Show the error to the user
      setResultMessage(`Error: ${error.message || 'Failed to submit quiz'}`);
      setShowResults(true); // Show results page with error
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRetry = () => {
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setQuizCompleted(false);
    setShowResults(false);
  };
  
  // Show results page if quiz is completed
  if (showResults) {
    return (
      <div className="space-y-6">
        <div className="text-center p-4">
          <div className="mb-4">
            {score >= 70 ? (
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            ) : (
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
            )}
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Quiz Results</h2>
          <p className="text-gray-400 mb-4">{resultMessage}</p>
          
          <div className="text-2xl font-bold mb-6">
            Score: {score}%
          </div>
          
          <div className="space-y-6 mt-8">
            <h3 className="text-xl font-semibold">Question Summary</h3>
            {questions.map((question, index) => (
              <Card key={question.id} className="p-4 bg-black/40 text-left">
                <div className="flex items-start">
                  <div className="mr-3 mt-1">
                    {selectedAnswers[question.id] === question.correctAnswer ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{index + 1}. {question.question}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Your answer: <span className={selectedAnswers[question.id] === question.correctAnswer ? "text-green-500" : "text-red-500"}>
                        {selectedAnswers[question.id] || "Not answered"}
                      </span>
                    </p>
                    {selectedAnswers[question.id] !== question.correctAnswer && (
                      <p className="text-sm text-green-500 mt-1">
                        Correct answer: {question.correctAnswer}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="flex justify-between mt-8">
            {score < 70 && (
              <Button onClick={handleRetry}>
                Try Again
              </Button>
            )}
            <Button asChild className="ml-auto">
              <a href={`/levels/${activity.levelId}`}>
                Return to Level
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Show quiz questions
  return (
    <div className="space-y-8">
      <div className="flex justify-between mb-4 text-sm text-gray-400">
        <div>Question {currentQuestionIndex + 1} of {questions.length}</div>
        <div>{Object.keys(selectedAnswers).length} of {questions.length} answered</div>
      </div>
      
      {currentQuestion ? (
        <div>
          <h3 className="text-xl font-semibold mb-6 text-white">{currentQuestion.question}</h3>
          <div className="text-xs text-gray-500 mb-2">Question ID: {currentQuestion.id}</div>
          
          <RadioGroup 
            value={selectedAnswers[currentQuestion.id] || ''} 
            onValueChange={handleAnswerSelect}
            className="space-y-3"
          >
            {currentQuestion.options.map((option) => (
              <div key={option} className="flex items-center space-x-2 p-3 rounded-md bg-gray-800/60 hover:bg-gray-700/70">
                <RadioGroupItem value={option} id={`${currentQuestion.id}-${option}`} />
                <Label htmlFor={`${currentQuestion.id}-${option}`} className="cursor-pointer text-gray-100">{option}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-400">No questions available for this quiz.</p>
        </div>
      )}
      
      <div className="flex justify-between pt-6">
        <Button 
          variant="outline" 
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>
        
        {currentQuestionIndex === questions.length - 1 ? (
          <Button 
            onClick={handleSubmitQuiz}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Quiz"}
          </Button>
        ) : (
          <Button 
            onClick={handleNextQuestion}
            disabled={!selectedAnswers[currentQuestion?.id]}
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
} 