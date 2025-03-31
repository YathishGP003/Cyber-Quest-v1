"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRound, FileText, Pencil, X, Mic } from 'lucide-react';

interface ButtonOption {
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  color: string;
}

const CareerCoachButtons = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleButtonClick = () => {
    setIsOpen(!isOpen);
    setSelectedOption(null);
  };

  const handleOptionClick = (option: string) => {
    setSelectedOption(option);
  };

  const handleActionClick = (route: string) => {
    router.push(route);
  };

  const buttonOptions: Record<string, ButtonOption> = {
    interview: {
      title: 'Mock Interview',
      description: 'Practice your interview skills with our AI interviewer and receive instant feedback.',
      icon: <Mic size={18} />,
      route: '/mock-interview',
      color: 'green'
    },
    resume: {
      title: 'Resume Builder',
      description: 'Create a professional resume tailored to cybersecurity positions with AI assistance.',
      icon: <FileText size={18} />,
      route: '/resume',
      color: 'blue'
    },
    coverLetter: {
      title: 'Cover Letter',
      description: 'Generate customized cover letters for your job applications with AI guidance.',
      icon: <Pencil size={18} />,
      route: '/ai-cover-letter',
      color: 'purple'
    }
  };

  const getBackButton = () => (
    <button
      onClick={() => setSelectedOption(null)}
      className="text-gray-400 hover:text-white absolute top-4 left-3"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
    </button>
  );

  const getOptionContent = () => {
    if (!selectedOption) {
      return (
        <div className="space-y-3">
          <button
            key="interview"
            onClick={() => handleOptionClick('interview')}
            className="w-full p-3 rounded-lg flex items-center gap-3 transition-colors bg-green-600/20 hover:bg-green-600/30 border border-green-500/30"
          >
            <div className="p-2 bg-green-600 rounded-full">
              {buttonOptions.interview.icon}
            </div>
            <span>{buttonOptions.interview.title}</span>
          </button>
          
          <button
            key="resume"
            onClick={() => handleOptionClick('resume')}
            className="w-full p-3 rounded-lg flex items-center gap-3 transition-colors bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30"
          >
            <div className="p-2 bg-blue-600 rounded-full">
              {buttonOptions.resume.icon}
            </div>
            <span>{buttonOptions.resume.title}</span>
          </button>
          
          <button
            key="coverLetter"
            onClick={() => handleOptionClick('coverLetter')}
            className="w-full p-3 rounded-lg flex items-center gap-3 transition-colors bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30"
          >
            <div className="p-2 bg-purple-600 rounded-full">
              {buttonOptions.coverLetter.icon}
            </div>
            <span>{buttonOptions.coverLetter.title}</span>
          </button>
        </div>
      );
    }

    const option = buttonOptions[selectedOption];
    const buttonColor = option.color === 'green' 
      ? 'bg-green-600 hover:bg-green-700' 
      : option.color === 'blue' 
        ? 'bg-blue-600 hover:bg-blue-700' 
        : 'bg-purple-600 hover:bg-purple-700';
    const textColor = option.color === 'green' 
      ? 'text-green-500' 
      : option.color === 'blue' 
        ? 'text-blue-500' 
        : 'text-purple-500';
    
    return (
      <div className="relative pt-3">
        {getBackButton()}
        <h3 className={`text-lg font-semibold ${textColor} mb-3 text-center`}>{option.title}</h3>
        <p className="text-sm text-gray-300 mb-4">
          {option.description}
        </p>
        <button
          onClick={() => handleActionClick(option.route)}
          className={`w-full py-2 px-4 ${buttonColor} text-white rounded-lg flex items-center justify-center gap-2 transition-colors`}
        >
          {option.icon}
          {option.title === 'Mock Interview' ? 'Start Interview' : option.title === 'Resume Builder' ? 'Create Resume' : 'Write Cover Letter'}
        </button>
      </div>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="mb-4 p-4 bg-black/80 rounded-lg shadow-xl border border-indigo-500/30 w-72 transform transition-all duration-300 ease-in-out">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-indigo-400">Career Tools</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
          
          {getOptionContent()}
        </div>
      )}
      
      <button
        onClick={handleButtonClick}
        className={`p-3 rounded-full shadow-lg transition-all duration-300 ease-in-out
          ${isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-500 hover:bg-indigo-600'}`}
      >
        {isOpen ? (
          <X size={24} className="text-white" />
        ) : (
          <UserRound size={24} className="text-white" />
        )}
      </button>
    </div>
  );
};

export default CareerCoachButtons; 