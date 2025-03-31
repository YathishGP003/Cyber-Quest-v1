import { getResume } from "../../../actions/resume";
import ResumeBuilder from "./_components/resume-builder";
import { redirect } from "next/navigation";
import { getUserOnboardingStatus } from "../../../actions/user";

export default async function ResumePage() {
  // Check if user is onboarded
  const { isOnboarded } = await getUserOnboardingStatus();

  if (!isOnboarded) {
    redirect("/onboarding");
  }

  const resume = await getResume();

  return (
    <div>
      <h1 className="text-6xl font-bold mb-10 gradient-title">
        AI Resume Builder
      </h1>
      <ResumeBuilder initialData={resume} />
    </div>
  );
}
