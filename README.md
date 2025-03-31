# Cybersecurity Learning Platform

A gamified cybersecurity learning platform with 10 progressive difficulty levels, each teaching a specific security concept.

## Features

- **User Authentication**: Secure user authentication and profile management with Clerk
- **10 Progressive Learning Levels**:
  - Level 1: Security Fundamentals (CIA triad, basic principles)
  - Level 2: Network Security (protocols, firewalls, packet analysis)
  - Level 3: Web Security (OWASP Top 10, injection attacks)
  - Level 4: Cryptography (encryption, hashing, digital signatures)
  - Level 5: Authentication & Authorization (access control, MFA)
  - Level 6: Social Engineering (phishing detection, scenarios)
  - Level 7: Malware Analysis (safe sample analysis)
  - Level 8: Digital Forensics (evidence collection, analysis)
  - Level 9: Incident Response (IR frameworks, simulations)
  - Level 10: Advanced Persistent Threats (complex attacks)
- **Interactive Challenges**: Various activity types including quizzes, code challenges, labs, and simulations
- **Gamification**: Points system, achievements, and progress tracking
- **Certificates**: Verifiable certificates upon completion of levels

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/cybersecurity-platform.git
   cd cybersecurity-platform
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` and fill in your database and Clerk credentials

4. Set up the database:
   ```bash
   npm run prisma:generate
   npm run prisma:push
   npm run prisma:seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Routes

### Levels
- `GET /api/levels` - Get all levels
- `GET /api/levels/:levelId` - Get a specific level with its activities

### Activities
- `GET /api/activities/:activityId` - Get a specific activity
- `POST /api/activities/:activityId/progress` - Submit activity progress

### Users
- `GET /api/users` - Get current user
- `POST /api/users` - Create or update user
- `GET /api/users/progress` - Get user progress
- `GET /api/users/achievements` - Get user achievements
- `POST /api/users/achievements` - Award an achievement to a user

### Achievements
- `GET /api/achievements` - Get all achievements

### Certificates
- `GET /api/certificates` - Get all certificates or verify a certificate
- `POST /api/certificates` - Generate a certificate

## License

This project is licensed under the MIT License - see the LICENSE file for details.
