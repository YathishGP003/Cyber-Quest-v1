"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRound, X, Mic } from 'lucide-react';

const MockInterviewButton = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleButtonClick = () => {
    setIsOpen(!isOpen);
  };

  const handleStartInterview = () => {
    router.push('/mock-interview');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="mb-4 p-4 bg-black/80 rounded-lg shadow-xl border border-green-500/30 w-64 transform transition-all duration-300 ease-in-out">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-green-500">Mock Interview</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
          
          <p className="text-sm text-gray-300 mb-4">
            Practice your interview skills with our AI interviewer and receive instant feedback.
          </p>
          
          <button
            onClick={handleStartInterview}
            className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Mic size={18} />
            Start Mock Interview
          </button>
        </div>
      )}
      
      <button
        onClick={handleButtonClick}
        className={`p-3 rounded-full shadow-lg transition-all duration-300 ease-in-out
          ${isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
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

export default MockInterviewButton; 