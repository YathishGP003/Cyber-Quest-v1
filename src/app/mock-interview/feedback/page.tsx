"use client";

import { Suspense } from "react";
import FeedbackPageContent from "./FeedbackPageContent"; 
export default function FeedbackPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <FeedbackPageContent />
    </Suspense>
  );
}
