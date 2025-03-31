import { SignUp } from "@clerk/nextjs";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | Cybersecurity Platform",
  description: "Create a new account",
};

export default function SignUpPage() {
  return (
    <div className="w-full">
      <h1 className="mb-6 text-center text-2xl font-bold">Create an Account</h1>
      <SignUp
        appearance={{
          elements: {
            formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
            footerActionLink: "text-blue-600 hover:text-blue-700",
          },
        }}
        redirectUrl="/dashboard"
      />
    </div>
  );
} 