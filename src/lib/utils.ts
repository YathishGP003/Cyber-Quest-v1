import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Function to generate random interview cover images (used in mock interviews)
export function getRandomInterviewCover(): string {
  const coverImages = [
    "/interview-cover-1.png",
    "/interview-cover-2.png",
    "/interview-cover-3.png",
    "/interview-cover-4.png",
    "/ai-avatar.png", // Fallback to AI avatar if others aren't available
  ];
  
  const randomIndex = Math.floor(Math.random() * coverImages.length);
  return coverImages[randomIndex];
}
