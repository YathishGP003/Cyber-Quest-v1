import Link from "next/link";
import { Button } from "../../../../components/ui/ai-button";
import { getCoverLetter } from "../../../../actions/cover-letter";
import { ArrowLeft, Download, Share } from "lucide-react";
import { notFound } from "next/navigation";
import { getUserOnboardingStatus } from "../../../../actions/user";
import { redirect } from "next/navigation";

export default async function CoverLetterPage({ params }) {
  // Check if user is onboarded
  const { isOnboarded } = await getUserOnboardingStatus();

  if (!isOnboarded) {
    redirect("/onboarding");
  }

  const coverLetter = await getCoverLetter(params.id);

  if (!coverLetter) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-4xl font-bold gradient-title">{coverLetter.jobTitle}</h1>
        <div className="flex gap-2">
          <Link href="/ai-cover-letter">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white text-black rounded-lg p-8 shadow-lg font-serif">
        <div className="mb-4">
          <h2 className="text-xl font-bold">{coverLetter.userName}</h2>
          {coverLetter.userEmail && (
            <p className="text-gray-600">{coverLetter.userEmail}</p>
          )}
        </div>

        <div className="mb-4">
          <p className="font-bold">
            {coverLetter.companyName && `${coverLetter.companyName}`}
          </p>
        </div>

        <div className="mb-6">
          <p className="font-bold">Re: {coverLetter.jobTitle}</p>
        </div>

        <div
          dangerouslySetInnerHTML={{ __html: coverLetter.content.replace(/\n/g, "<br>") }}
          className="whitespace-pre-wrap leading-relaxed"
        />
      </div>
    </div>
  );
}
