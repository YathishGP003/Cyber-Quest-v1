import { type PropsWithChildren } from "react";
import Image from "next/image";

const AuthLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className="flex h-screen w-full">
      <div className="flex h-full w-full flex-col items-center justify-center md:w-1/2">
        <div className="mb-8">
          <Image
            src="/logo.svg"
            width={180}
            height={60}
            alt="Cybersecurity Platform Logo"
            priority
          />
        </div>
        <div className="w-full max-w-md px-6">
          {children}
        </div>
      </div>
      <div className="hidden h-full w-1/2 bg-gradient-to-br from-blue-600 to-purple-900 md:flex md:items-center md:justify-center">
        <div className="p-8 text-center text-white">
          <h1 className="mb-6 text-4xl font-bold">Cybersecurity Platform</h1>
          <p className="text-xl">
            Learn cybersecurity skills through interactive challenges, labs, and simulations.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout; 