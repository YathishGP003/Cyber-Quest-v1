"use client";

import { Badge } from "@/components/ui/badge";
import { Award, Clock } from "lucide-react";
import dynamic from "next/dynamic";

const DownloadCertificateButton = dynamic(
  () => import("@/components/DownloadCertificateButton"),
  { ssr: false }
);

interface Certificate {
  id: number;
  title: string;
  description: string;
  issueDate: Date;
  verificationCode: string;
  skills: string[];
}

interface CertificateSectionProps {
  certificates: Certificate[];
  totalPoints: number;
  userName: string;
}

export default function CertificateSection({ 
  certificates, 
  totalPoints, 
  userName
}: CertificateSectionProps) {
  // Format date function
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  return (
    <>
      {certificates.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {certificates.map((certificate) => (
            <div key={certificate.id} className="bg-black/20 border border-green-500/20 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-lg">{certificate.title}</h3>
                  <p className="text-sm text-white/70 mt-1">{certificate.description}</p>
                </div>
                <span 
                  style={{ 
                    backgroundColor: 'rgba(34, 197, 94, 0.8)',
                    borderRadius: '0.375rem',
                    padding: '0.125rem 0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: 'white'
                  }}
                >
                  Verified
                </span>
              </div>
              
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {certificate.skills.map((skill, index) => (
                    <span 
                      key={index} 
                      style={{ 
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '0.375rem',
                        padding: '0.125rem 0.5rem',
                        fontSize: '0.75rem',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'white'
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-4 text-sm text-white/70">
                <div className="flex items-center">
                  <Clock className="mr-1 h-3 w-3" />
                  Issued on {formatDate(certificate.issueDate)}
                </div>
                <div>
                  Verification: {certificate.verificationCode.substring(0, 8)}...
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Award className="h-12 w-12 text-gray-500 mx-auto mb-3" />
          <p className="text-white/70">Complete levels to earn certificates!</p>
          <p className="text-sm text-white/50 mt-2">Certificates are awarded when you master specific cybersecurity domains.</p>
        </div>
      )}
      
      {/* Add the Download Certificate Button */}
      <DownloadCertificateButton 
        totalPoints={totalPoints} 
        userName={userName}
        pointsRequired={1500}
      />
    </>
  );
} 