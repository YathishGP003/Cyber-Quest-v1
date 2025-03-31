import Link from "next/link";
import { Button } from "../../../../components/ui/ai-button";
import { ArrowLeft } from "lucide-react";
import CoverLetterGenerator from "../_components/cover-letter-generator";
import { redirect } from "next/navigation";
import { getUserOnboardingStatus } from "../../../../actions/user";

export default async function NewCoverLetterPage() {
  // Check if user is onboarded
  const { isOnboarded } = await getUserOnboardingStatus();

  if (!isOnboarded) {
    redirect("/onboarding");
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-2">
        <Link href="/ai-cover-letter">
          <Button variant="link" className="gap-2 pl-0">
            <ArrowLeft className="h-4 w-4" />
            Back to Cover Letters
          </Button>
        </Link>

        <div className="pb-6">
          <h1 className="text-6xl font-bold gradient-title">
            Create Cover Letter
          </h1>
          <p className="text-muted-foreground">
            Generate a tailored cover letter for your job application
          </p>
        </div>
      </div>

      <CoverLetterGenerator />
    </div>
  );
}
