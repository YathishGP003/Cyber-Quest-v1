"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

export default function FixProgressButton() {
  const [isFixing, setIsFixing] = useState(false);
  const [result, setResult] = useState<null | { success: boolean; message: string }>(null);
  
  const handleFixProgress = async () => {
    try {
      setIsFixing(true);
      setResult(null);
      
      const response = await fetch('/api/check-progress');
      const data = await response.json();
      
      if (data.success) {
        setResult({
          success: true,
          message: `Progress fixed! ${data.fixedIssues.length ? `Fixed ${data.fixedIssues.length} issues.` : 'No issues found.'}`
        });
        
        // Reload the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to fix progress.'
        });
      }
    } catch (error) {
      console.error('Error fixing progress:', error);
      setResult({
        success: false,
        message: 'An error occurred. Please try again.'
      });
    } finally {
      setIsFixing(false);
    }
  };
  
  return (
    <div>
      <button
        onClick={handleFixProgress}
        disabled={isFixing}
        className="text-xs bg-black/30 border border-green-500/30 hover:bg-black/50 px-3 py-2 rounded-md flex items-center text-white/85"
      >
        <RefreshCw className={`h-3 w-3 mr-1 ${isFixing ? 'animate-spin' : ''}`} />
        {isFixing ? 'Fixing...' : 'Fix Progress Issues'}
      </button>
      
      {result && (
        <div className={`text-xs mt-1 ${result.success ? 'text-green-400' : 'text-red-400'}`}>
          {result.message}
        </div>
      )}
    </div>
  );
} 