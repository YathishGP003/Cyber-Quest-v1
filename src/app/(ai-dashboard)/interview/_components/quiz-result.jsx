"use client";

import { Trophy, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "../../../../components/ui/ai-button";
import { CardContent, CardFooter } from "../../../../components/ui/ai-card";
import { Progress } from "../../../../components/ui/ai-progress";

export default function QuizResult({
  result,
  hideStartNew = false,
  onStartNew,
}) {
  if (!result) return null;

  return (
    <div className="mx-auto">
      <h1 className="flex items-center gap-2 text-3xl gradient-title">
        <Trophy className="h-6 w-6 text-yellow-500" />
        Quiz Results
      </h1>

      <CardContent className="space-y-6">
        {/* Score Overview */}
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold">{result.score.toFixed(1)}%</h3>
          <Progress value={result.score} className="w-full" />
        </div>

        {/* Improvement Tip */}
        {result.feedback && (
          <div className="bg-muted p-4 rounded-lg">
            <p className="font-medium">Improvement Tip:</p>
            <p className="text-muted-foreground">{result.feedback}</p>
          </div>
        )}

        {/* Questions Review or Recommendations */}
        <div className="space-y-4">
          {result.questions ? (
            /* If questions are available, show question review */
            <>
              <h3 className="font-medium">Question Review</h3>
              {result.questions.map((q, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{q.question}</p>
                    {q.isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Your answer: {q.userAnswer}</p>
                    {!q.isCorrect && <p>Correct answer: {q.answer}</p>}
                  </div>
                  <div className="text-sm bg-muted p-2 rounded">
                    <p className="font-medium">Explanation:</p>
                    <p>{q.explanation}</p>
                  </div>
                </div>
              ))}
            </>
          ) : (
            /* If no questions but recommendations are available */
            result.recommendations && (
              <>
                <h3 className="font-medium">Study Recommendations</h3>
                <ul className="space-y-2">
                  {result.recommendations.map((recommendation, index) => (
                    <li key={index} className="border rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        <p>{recommendation}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )
          )}
        </div>
      </CardContent>

      {!hideStartNew && (
        <CardFooter>
          <Button onClick={onStartNew} className="w-full">
            Start New Quiz
          </Button>
        </CardFooter>
      )}
    </div>
  );
}
