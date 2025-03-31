"use server";

import { db } from "../lib/db";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const generateAIInsights = async (industry) => {
  const prompt = `
          Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
          {
            "description": "string",
            "salaryRanges": [
              { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
            ],
            "growthRate": number,
            "demandLevel": "High" | "Medium" | "Low",
            "topSkills": ["skill1", "skill2"],
            "marketOutlook": "Positive" | "Neutral" | "Negative",
            "keyTrends": ["trend1", "trend2"],
            "recommendedSkills": ["skill1", "skill2"]
          }
          
          IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
          Include at least 5 common roles for salary ranges.
          Growth rate should be a percentage.
          Include at least 5 skills and trends.
          Description should be a concise overview of the industry's current state and future prospects.
        `;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

  let parsedData = JSON.parse(cleanedText);
  
  // Ensure description field exists
  if (!parsedData.description) {
    parsedData.description = `Overview of the ${industry} industry`;
  }

  // Adapt data to match Prisma schema
  const adaptedData = {
    description: parsedData.description,
    trends: Array.isArray(parsedData.keyTrends) ? parsedData.keyTrends : [],
    skills: Array.isArray(parsedData.topSkills) ? parsedData.topSkills : 
           (Array.isArray(parsedData.recommendedSkills) ? parsedData.recommendedSkills : []),
    // Convert salaryRanges array to a string to match the schema
    salaryRange: parsedData.salaryRanges ? JSON.stringify(parsedData.salaryRanges) : null,
    growthRate: parsedData.growthRate || 0,
    demandLevel: parsedData.demandLevel || null,
    marketOutlook: parsedData.marketOutlook || null
  };

  return adaptedData;
};

export async function getIndustryInsights() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: {
      industryInsight: true,
    },
  });

  if (!user) throw new Error("User not found");

  // If no insights exist, generate them
  if (!user.industryInsight) {
    const insights = await generateAIInsights(user.industry);
    
    // Data already adapted in generateAIInsights
    const industryInsight = await db.industryInsight.create({
      data: {
        industry: user.industry,
        ...insights,
        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Add updatedAt for UI consistency
    return {
      ...industryInsight,
      updatedAt: new Date(),
    };
  }

  // Add lastUpdated field for UI consistency
  return {
    ...user.industryInsight,
    updatedAt: user.industryInsight.nextUpdate 
      ? new Date(user.industryInsight.nextUpdate.getTime() - 7 * 24 * 60 * 60 * 1000) 
      : new Date()
  };
}
