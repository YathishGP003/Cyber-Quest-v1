// Define our own types matching the Prisma schema
export type ActivityType = 'QUIZ' | 'CODE_CHALLENGE' | 'LAB' | 'SIMULATION' | 'READING';

export interface User {
  id: string;
  email: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  createdAt: Date;
  updatedAt: Date;
  currentLevel: number;
  totalPoints: number;
}

export interface Level {
  id: number;
  name: string;
  description: string;
  order: number;
  minPointsToPass: number;
  requiredToAdvance: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Activity {
  id: number;
  levelId: number;
  name: string;
  description: string;
  type: ActivityType;
  content: any;
  points: number;
  order: number;
  isRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProgress {
  id: number;
  userId: string;
  levelId: number;
  isCompleted: boolean;
  pointsEarned: number;
  activitiesCompleted: number;
  startedAt: Date;
  completedAt?: Date | null;
}

export interface ActivityProgress {
  id: number;
  userId: string;
  activityId: number;
  progressId: number;
  isCompleted: boolean;
  pointsEarned: number;
  attempts: number;
  lastAttemptAt?: Date | null;
  completedAt?: Date | null;
  answers?: any;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  imageUrl?: string | null;
  levelId?: number | null;
  criteria: string;
  pointsValue: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAchievement {
  id: number;
  userId: string;
  achievementId: number;
  earnedAt: Date;
}

export interface Certificate {
  id: number;
  userId: string;
  title: string;
  description: string;
  issueDate: Date;
  verificationCode: string;
  skills: string[];
  imageUrl?: string | null;
}

// Composite types with relations
export interface LevelWithActivities extends Level {
  activities: Activity[];
}

export interface UserWithProgress extends User {
  progress: UserProgress[];
}

export interface ActivityWithProgress extends Activity {
  progress: ActivityProgress[];
}

export interface UserProgressWithActivities extends UserProgress {
  activityProgress: ActivityProgress[];
}

export interface LevelWithProgress extends Level {
  progress: UserProgress[];
}

// Activity content interfaces
export interface QuizContent {
  questions: {
    question: string;
    options: string[];
    correctAnswer: string;
  }[];
}

export interface ReadingContent {
  sections: {
    title: string;
    content: string;
  }[];
}

export interface LabContent {
  scenario: string;
  tasks: string[];
  resources: string[];
}

export interface CodeChallengeContent {
  instructions: string;
  initialCode: string;
  testCases: {
    input: string;
    expectedOutput: string;
  }[];
}

export interface SimulationContent {
  scenario: string;
  steps: {
    instruction: string;
    expectedAction: string;
  }[];
}

// Request/response interfaces
export interface UserActivitySubmission {
  userId: string;
  activityId: number;
  answers?: any;
  completed: boolean;
}

export interface UserLevelCompletion {
  userId: string;
  levelId: number;
} 