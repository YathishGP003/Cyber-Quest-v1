import { NextResponse } from "next/server";

// This simulates AI-generated questions for different specializations
// In a real implementation, you would use an actual AI service like OpenAI

const questionsBySpecialization: Record<string, string[]> = {
  // General cybersecurity questions
  "cybersecurity": [
    "What motivated you to pursue a career in cybersecurity?",
    "How do you stay updated with the latest cybersecurity threats and vulnerabilities?",
    "Explain the concept of defense in depth and why it's important.",
    "How would you explain a complex cybersecurity issue to a non-technical stakeholder?",
    "What do you consider the biggest challenge in the cybersecurity industry today?",
    "Describe your experience with incident response and how you approach it.",
    "How do you prioritize security vulnerabilities when there are many to address?",
    "What security frameworks or standards are you familiar with?",
    "How do you approach security awareness training for an organization?",
    "Where do you see the cybersecurity field evolving in the next 5 years?"
  ],
  
  // Network security specific questions
  "network security": [
    "Explain the concept of network segmentation and its security benefits.",
    "How would you secure a corporate network from both external and internal threats?",
    "What tools do you use for network monitoring and threat detection?",
    "Describe your experience with firewalls and how you configure them securely.",
    "How would you detect and respond to a suspicious network traffic pattern?",
    "What are the security considerations when implementing a VPN solution?",
    "Explain the difference between IDS and IPS systems and when you would use each.",
    "How do you approach vulnerability scanning on a large network?",
    "What protocols would you disable on a network to improve security posture?",
    "How would you secure a wireless network in an enterprise environment?"
  ],
  
  // Application security specific questions
  "application security": [
    "What is the OWASP Top 10 and why is it important?",
    "How do you approach secure coding practices in a development team?",
    "Explain the concept of input validation and why it's critical.",
    "What tools or methods do you use for static and dynamic application security testing?",
    "How would you implement authentication and authorization in a web application?",
    "Describe your experience with API security.",
    "How do you handle sensitive data in applications?",
    "What is your approach to security in the software development lifecycle?",
    "How would you test for SQL injection vulnerabilities?",
    "What are some common pitfalls in secure coding that you've encountered?"
  ],
  
  // Cloud security specific questions
  "cloud security": [
    "What are the unique security challenges of cloud environments?",
    "How does security in the cloud differ from on-premises security?",
    "Describe your experience with securing AWS/Azure/GCP environments.",
    "What is the shared responsibility model in cloud security?",
    "How would you implement least privilege in a cloud environment?",
    "What tools do you use for cloud security monitoring and compliance?",
    "How do you approach identity and access management in the cloud?",
    "What considerations are important when securing containers and serverless architectures?",
    "How would you secure data in transit and at rest in a cloud environment?",
    "Describe how you would respond to a security incident in a cloud environment."
  ],
  
  // Penetration testing specific questions
  "penetration testing": [
    "Describe your methodology for conducting a penetration test.",
    "What tools do you commonly use during penetration tests?",
    "How do you prioritize findings in a penetration test report?",
    "Explain how you would approach testing a web application for vulnerabilities.",
    "What is your process for network enumeration during a pentest?",
    "How do you ensure that a penetration test doesn't cause disruption to services?",
    "Describe a particularly challenging vulnerability you discovered during a pentest.",
    "How do you stay within the scope of an engagement?",
    "What documentation do you prepare before and after a penetration test?",
    "How do you differentiate between a vulnerability and an exploit?"
  ],
  
  // Security operations specific questions
  "security operations": [
    "Describe your experience with SIEM solutions.",
    "How do you approach alert triage in a SOC environment?",
    "What is your process for incident response?",
    "How do you reduce false positives in security monitoring?",
    "Describe your experience with threat hunting.",
    "How do you keep up with emerging threats and tactics?",
    "What metrics do you think are important to track in a SOC?",
    "How would you detect lateral movement in a network?",
    "Describe how you would respond to a ransomware incident.",
    "What is your approach to security automation?"
  ],
  
  // Compliance and risk management specific questions
  "compliance": [
    "What regulatory frameworks are you familiar with?",
    "How do you translate compliance requirements into technical controls?",
    "Describe your approach to risk assessment and management.",
    "How do you prioritize security investments based on risk?",
    "What is your experience with security audits and assessments?",
    "How do you measure the effectiveness of a security program?",
    "Describe how you would build a security roadmap for an organization.",
    "How do you ensure ongoing compliance in a changing regulatory landscape?",
    "What is your approach to third-party risk management?",
    "How do you communicate security risks to executive leadership?"
  ]
};

// Additional job-specific questions
const jobTitleQuestions: Record<string, string[]> = {
  "Cybersecurity Analyst": [
    "What tools do you use for log analysis?",
    "How do you determine if an alert requires escalation?",
    "Describe your experience with threat intelligence platforms.",
    "How would you detect an insider threat?",
    "What's your approach to documenting security incidents?"
  ],
  
  "Security Engineer": [
    "Describe a security architecture you've designed or implemented.",
    "How do you approach automating security processes?",
    "What considerations do you take into account when selecting security tools?",
    "How do you test security controls after implementation?",
    "Describe your experience with DevSecOps practices."
  ],
  
  "Penetration Tester": [
    "How do you prepare for a red team engagement?",
    "What's your approach to social engineering during a pentest?",
    "How do you ensure complete coverage during a penetration test?",
    "Describe a time when you had to pivot during a penetration test.",
    "How do you write an effective penetration test report?"
  ],
  
  "CISO": [
    "How do you develop and maintain a security strategy?",
    "How do you measure and communicate the ROI of security investments?",
    "What's your approach to building a security team?",
    "How do you balance security with business requirements?",
    "Describe how you would respond to a major security breach as a CISO."
  ]
};

export async function POST(req: Request) {
  try {
    const { previousMessages, questionCount, specialization, jobTitle } = await req.json();
    
    // Simulate AI processing by selecting contextually relevant questions
    let potentialQuestions: string[] = [];
    
    // Add specialization-specific questions
    if (specialization && questionsBySpecialization[specialization]) {
      potentialQuestions = potentialQuestions.concat(questionsBySpecialization[specialization]);
    } else {
      // Fallback to general cybersecurity questions
      potentialQuestions = potentialQuestions.concat(questionsBySpecialization["cybersecurity"]);
    }
    
    // Add job-specific questions if available
    if (jobTitle && jobTitleQuestions[jobTitle]) {
      potentialQuestions = potentialQuestions.concat(jobTitleQuestions[jobTitle]);
    }
    
    // If we don't have enough questions, add generic ones
    if (potentialQuestions.length < 5) {
      potentialQuestions = potentialQuestions.concat([
        `What experience do you have related to ${specialization || "cybersecurity"}?`,
        `How do you stay updated with the latest developments in ${specialization || "cybersecurity"}?`,
        `What challenges do you anticipate in the role of ${jobTitle || "cybersecurity professional"}?`,
        "Can you describe a difficult technical problem you've solved?",
        "Where do you see yourself in five years?"
      ]);
    }
    
    // Randomly select a question, ensuring we don't repeat
    // In a real AI implementation, the AI would generate contextually appropriate questions
    let questionIndex = questionCount % potentialQuestions.length;
    // Add some randomness to mimic AI variability
    if (questionCount > 0) {
      questionIndex = Math.floor(Math.random() * potentialQuestions.length);
    }
    
    return NextResponse.json({
      success: true,
      question: potentialQuestions[questionIndex],
    });
    
  } catch (error) {
    console.error("Error generating question:", error);
    return NextResponse.json(
      { error: "Failed to generate question" },
      { status: 500 }
    );
  }
} 