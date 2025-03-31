const { PrismaClient: CybersecPrisma } = require('../prisma/client');
const { PrismaClient: CareerCoachPrisma } = require('../career-coach-prisma/client');

async function migrateData() {
  const cybersecPrisma = new CybersecPrisma();
  const careerCoachPrisma = new CareerCoachPrisma();
  
  // Get mapping between users in both systems
  // You'll need to define a mapping between users in both systems
  // This could be based on email or other identifiers
  const userMapping = await createUserMapping(cybersecPrisma, careerCoachPrisma);
  
  // Migrate career profiles
  const careerProfiles = await careerCoachPrisma.careerProfile.findMany();
  for (const profile of careerProfiles) {
    const cybersecUserId = userMapping[profile.userId];
    if (cybersecUserId) {
      await cybersecPrisma.careerProfile.create({
        data: {
          userId: cybersecUserId,
          industry: profile.industry,
          subIndustry: profile.subIndustry,
          experience: profile.experience,
          skills: profile.skills,
          bio: profile.bio
        }
      });
    }
  }
  
  // Similarly migrate resumes, cover letters, interviews, etc.
}

async function createUserMapping(cybersecPrisma, careerCoachPrisma) {
  // Create a mapping between user IDs in both systems
  // This would typically use email addresses or other identifiers
  const mapping = {};
  
  const cybersecUsers = await cybersecPrisma.user.findMany();
  const careerCoachUsers = await careerCoachPrisma.user.findMany();
  
  for (const ccUser of careerCoachUsers) {
    const matchingUser = cybersecUsers.find(user => user.email === ccUser.email);
    if (matchingUser) {
      mapping[ccUser.id] = matchingUser.id;
    }
  }
  
  return mapping;
}

migrateData()
  .catch(e => console.error(e))
  .finally(async () => {
    await cybersecPrisma.$disconnect();
    await careerCoachPrisma.$disconnect();
  }); 