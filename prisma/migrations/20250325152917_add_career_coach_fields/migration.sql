-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "experience" INTEGER,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "skills" TEXT[];

-- CreateTable
CREATE TABLE "IndustryInsight" (
    "industry" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "trends" TEXT[],
    "skills" TEXT[],
    "salaryRange" TEXT,
    "growthRate" DOUBLE PRECISION,

    CONSTRAINT "IndustryInsight_pkey" PRIMARY KEY ("industry")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "feedback" TEXT NOT NULL,
    "recommendations" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_industry_fkey" FOREIGN KEY ("industry") REFERENCES "IndustryInsight"("industry") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
