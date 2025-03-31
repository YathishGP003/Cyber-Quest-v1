"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CheckCircle, Terminal, ExternalLink, Shield, Copy, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CryptoHashingLabProps {
  activity: any;
  userId: string;
  progress: any;
}

export default function CryptoHashingLab({ activity, userId, progress }: CryptoHashingLabProps) {
  const router = useRouter();
  const [isCompleted, setIsCompleted] = useState(progress?.isCompleted || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("instructions");
  
  // Hashing & encryption variables
  const [inputText, setInputText] = useState("");
  const [hashMethod, setHashMethod] = useState("md5");
  const [hashResult, setHashResult] = useState("");
  const [successSteps, setSuccessSteps] = useState<string[]>([]);
  const [encryptionInput, setEncryptionInput] = useState("");
  const [encryptionKey, setEncryptionKey] = useState("");
  const [encryptionResult, setEncryptionResult] = useState("");
  const [decryptionInput, setDecryptionInput] = useState("");
  const [decryptionKey, setDecryptionKey] = useState("");
  const [decryptionResult, setDecryptionResult] = useState("");
  const [encryptionMethod, setEncryptionMethod] = useState("caesar");
  const [encryptionMode, setEncryptionMode] = useState<"encrypt" | "decrypt">("encrypt");
  
  // Extracted content from activity
  const content = typeof activity.content === 'string'
    ? JSON.parse(activity.content)
    : activity.content;

  // Simulated hash functions
  const hashFunctions = {
    md5: (text: string) => simulateHash(text, 'md5'),
    sha1: (text: string) => simulateHash(text, 'sha1'),
    sha256: (text: string) => simulateHash(text, 'sha256'),
    bcrypt: (text: string) => simulateHash(text, 'bcrypt', true)
  };

  // Simulated encryption functions
  const encryptionFunctions = {
    caesar: (text: string, key: string, decrypt = false) => {
      // Simple Caesar cipher implementation
      if (!text) return "";
      const shift = parseInt(key) % 26 || 0;
      const actualShift = decrypt ? (26 - shift) % 26 : shift;
      
      return text.split('').map(char => {
        if (char.match(/[a-z]/i)) {
          const code = char.charCodeAt(0);
          const isUpperCase = code >= 65 && code <= 90;
          const offset = isUpperCase ? 65 : 97;
          return String.fromCharCode(((code - offset + actualShift) % 26) + offset);
        }
        return char;
      }).join('');
    },
    vigenere: (text: string, key: string, decrypt = false) => {
      if (!text || !key) return "";
      
      // Ensure key is only letters
      const cleanKey = key.replace(/[^a-zA-Z]/g, '').toUpperCase();
      if (cleanKey.length === 0) return "Invalid key (must contain letters)";
      
      return text.split('').map((char, i) => {
        if (char.match(/[a-z]/i)) {
          const isUpperCase = char === char.toUpperCase();
          const charCode = char.toUpperCase().charCodeAt(0) - 65;
          const keyChar = cleanKey[i % cleanKey.length].charCodeAt(0) - 65;
          let newCharCode;
          
          if (decrypt) {
            // Decrypt: subtract key (with wrap-around)
            newCharCode = (charCode - keyChar + 26) % 26;
          } else {
            // Encrypt: add key (with wrap-around)
            newCharCode = (charCode + keyChar) % 26;
          }
          
          const newChar = String.fromCharCode(newCharCode + 65);
          return isUpperCase ? newChar : newChar.toLowerCase();
        }
        return char;
      }).join('');
    }
  };

  // Function to simulate cryptographic hash
  function simulateHash(text: string, algorithm: string, salt = false): string {
    if (!text) return "";
    
    // Basic string manipulation to simulate different hashing algorithms
    // This is just for educational purposes, not actual cryptographic hashing
    
    let hash = "";
    const textBytes = text.split('').map(c => c.charCodeAt(0));
    
    if (algorithm === 'md5') {
      // Simulate 32 character MD5 hash (not cryptographically accurate)
      hash = Array.from({ length: 32 }, (_, i) => {
        const sum = textBytes.reduce((a, b) => a + b, 0) * (i + 1);
        return "0123456789abcdef"[sum % 16];
      }).join('');
    } 
    else if (algorithm === 'sha1') {
      // Simulate 40 character SHA1 hash (not cryptographically accurate)
      hash = Array.from({ length: 40 }, (_, i) => {
        const sum = textBytes.reduce((a, b) => a * b + i, 1);
        return "0123456789abcdef"[sum % 16];
      }).join('');
    }
    else if (algorithm === 'sha256') {
      // Simulate 64 character SHA256 hash (not cryptographically accurate)
      hash = Array.from({ length: 64 }, (_, i) => {
        const sum = textBytes.reduce((a, b, idx) => (a ^ b) + idx + i, 0);
        return "0123456789abcdef"[sum % 16];
      }).join('');
    }
    else if (algorithm === 'bcrypt') {
      // Simulate BCrypt with salt (not cryptographically accurate)
      const saltValue = salt ? "$2a$10$" + Math.random().toString(36).substring(2, 15) : "";
      const base = Array.from({ length: 23 }, () => {
        return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789./"[Math.floor(Math.random() * 64)];
      }).join('');
      hash = saltValue + base;
    }
    
    return hash;
  }

  // Function to handle text hashing
  const handleHash = () => {
    if (!inputText) {
      toast.error("Please enter text to hash");
      return;
    }
    
    const hash = hashFunctions[hashMethod as keyof typeof hashFunctions](inputText);
    setHashResult(hash);
    
    // Check for completion of hashing challenge
    if (!successSteps.includes('hash') && hash) {
      setSuccessSteps([...successSteps, 'hash']);
      toast.success("Challenge complete: You successfully created a hash!");
    }
  };

  // Function to handle encryption and decryption
  const handleCrypto = (mode: 'encrypt' | 'decrypt') => {
    setEncryptionMode(mode);
    
    if (mode === 'encrypt') {
      if (!encryptionInput) {
        toast.error("Please enter text to encrypt");
        return;
      }
      
      if (!encryptionKey) {
        toast.error("Please enter an encryption key");
        return;
      }
      
      const encrypted = encryptionFunctions[encryptionMethod as keyof typeof encryptionFunctions](
        encryptionInput, 
        encryptionKey
      );
      
      setEncryptionResult(encrypted);
      setDecryptionInput(encrypted); // Set up for decryption
      setDecryptionKey(encryptionKey); // Copy the key
      
      // Check for completion of encryption challenge
      if (!successSteps.includes('encrypt') && encrypted) {
        setSuccessSteps([...successSteps, 'encrypt']);
        toast.success("Challenge complete: You successfully encrypted a message!");
      }
    } else {
      if (!decryptionInput) {
        toast.error("Please enter text to decrypt");
        return;
      }
      
      if (!decryptionKey) {
        toast.error("Please enter a decryption key");
        return;
      }
      
      const decrypted = encryptionFunctions[encryptionMethod as keyof typeof encryptionFunctions](
        decryptionInput, 
        decryptionKey, 
        true // decrypt mode
      );
      
      setDecryptionResult(decrypted);
      
      // Check for completion of decryption challenge
      if (!successSteps.includes('decrypt') && decrypted && 
          decrypted.toLowerCase() === encryptionInput.toLowerCase()) {
        setSuccessSteps([...successSteps, 'decrypt']);
        toast.success("Challenge complete: You successfully decrypted a message!");
      }
    }
  };

  // Function to copy hash result to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success("Copied to clipboard"))
      .catch(err => toast.error("Failed to copy: " + err));
  };

  // Check for all challenges complete
  const allChallengesComplete = successSteps.includes('hash') && 
                                 successSteps.includes('encrypt') && 
                                 successSteps.includes('decrypt');

  // Submit completion to backend
  const handleSubmitLab = async () => {
    if (!allChallengesComplete) {
      toast.error("Please complete all challenges before submitting");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/activities/${activity.id}/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          activityId: activity.id,
          isCompleted: true,
          pointsEarned: activity.points,
        }),
      });

      if (response.ok) {
        setIsCompleted(true);
        toast.success("Lab completed successfully!");
        router.refresh();
      } else {
        toast.error("Failed to submit lab progress");
      }
    } catch (error) {
      console.error("Error submitting lab:", error);
      toast.error("An error occurred while submitting");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{content?.title || "Cryptography & Hashing Lab"}</h2>
          <p className="text-muted-foreground">
            {content?.description || "Explore cryptographic hashing and encryption techniques"}
          </p>
        </div>
        {isCompleted && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1 px-3 py-1">
            <CheckCircle className="h-4 w-4" />
            Completed
          </Badge>
        )}
      </div>

      <Tabs defaultValue="instructions" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="instructions">Instructions</TabsTrigger>
          <TabsTrigger value="hashing">Hashing</TabsTrigger>
          <TabsTrigger value="encryption">Encryption</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="submit">Submit</TabsTrigger>
        </TabsList>

        <TabsContent value="instructions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lab Instructions</CardTitle>
              <CardDescription>Learn how cryptographic hashing and encryption work</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content?.instructions || `
                <p>In this lab, you'll learn about two fundamental cryptographic concepts:</p>
                <h3>1. Cryptographic Hashing</h3>
                <p>Hashing is a one-way function that converts any input into a fixed-size output (hash value). Key properties:</p>
                <ul>
                  <li><strong>One-way function:</strong> It's computationally infeasible to reverse a hash back to its original input</li>
                  <li><strong>Deterministic:</strong> The same input will always produce the same hash value</li>
                  <li><strong>Collision resistant:</strong> It's difficult to find two different inputs that produce the same hash</li>
                  <li><strong>Avalanche effect:</strong> Small changes in input produce drastically different hash values</li>
                </ul>
                <p>Common uses: Password storage, data integrity verification, digital signatures</p>
                
                <h3>2. Encryption</h3>
                <p>Encryption converts data into a coded format that can be decoded back to the original with a key. Types:</p>
                <ul>
                  <li><strong>Symmetric encryption:</strong> Same key used for encryption and decryption</li>
                  <li><strong>Asymmetric encryption:</strong> Different keys used for encryption (public) and decryption (private)</li>
                </ul>
                <p>Common uses: Secure communications, data protection, digital certificates</p>
                
                <h3>Lab Challenges:</h3>
                <ol>
                  <li>Create hashes of different inputs and observe the properties</li>
                  <li>Encrypt a message using a symmetric cipher</li>
                  <li>Decrypt an encrypted message</li>
                </ol>
              `}} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hashing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cryptographic Hashing</CardTitle>
              <CardDescription>Explore how different hashing algorithms work</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label htmlFor="input-text">Enter text to hash:</Label>
                  <div className="flex gap-2">
                    <Input
                      id="input-text"
                      placeholder="Enter some text..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="hash-method">Select hashing algorithm:</Label>
                  <div className="flex gap-2">
                    <Select value={hashMethod} onValueChange={setHashMethod}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select hash algorithm" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="md5">MD5 (Fast but vulnerable)</SelectItem>
                        <SelectItem value="sha1">SHA-1 (Legacy)</SelectItem>
                        <SelectItem value="sha256">SHA-256 (Secure)</SelectItem>
                        <SelectItem value="bcrypt">BCrypt (Password-specific with salt)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleHash} className="flex gap-2 items-center">
                      <Terminal className="h-4 w-4" /> Generate Hash
                    </Button>
                  </div>
                </div>
                
                {hashResult && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Hash result:</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(hashResult)}
                        className="h-8 px-2"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                      {hashResult}
                    </div>
                    
                    <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 text-black text-sm mt-2">
                      <p><strong>Security note:</strong> {
                        hashMethod === 'md5' ? 
                          "MD5 is considered cryptographically broken and unsuitable for security applications." : 
                        hashMethod === 'sha1' ? 
                          "SHA-1 is deprecated for security use due to demonstrated collision attacks." :
                        hashMethod === 'sha256' ? 
                          "SHA-256 is currently considered secure for most applications." :
                          "BCrypt is designed specifically for password hashing with built-in salting and work factors."
                      }</p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label>Hash Properties Demonstration:</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-4 border">
                      <h4 className="font-medium mb-2">Avalanche Effect</h4>
                      <p className="text-sm text-white/85 mb-3">
                        Try changing a single character in your input. Notice how the entire hash changes drastically.
                      </p>
                    </Card>
                    <Card className="p-4 border">
                      <h4 className="font-medium mb-2">Fixed Output Length</h4>
                      <p className="text-sm text-white/85 mb-3">
                        Whether your input is short or long, the hash output length remains the same.
                      </p>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="encryption" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Encryption & Decryption</CardTitle>
              <CardDescription>Explore symmetric encryption algorithms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="encryption-method" className="mb-2 block">Select encryption algorithm:</Label>
                  <RadioGroup 
                    value={encryptionMethod} 
                    onValueChange={(value) => setEncryptionMethod(value as "caesar" | "vigenere")}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="caesar" id="caesar" />
                      <Label htmlFor="caesar">Caesar Cipher (shift cipher using a numerical key)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="vigenere" id="vigenere" />
                      <Label htmlFor="vigenere">Vigenère Cipher (polyalphabetic substitution using a keyword)</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="grid gap-6 pt-4 border-t">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Encryption</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="encryption-input">Text to encrypt:</Label>
                      <Input
                        id="encryption-input"
                        placeholder="Enter plaintext..."
                        value={encryptionInput}
                        onChange={(e) => setEncryptionInput(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="encryption-key">
                        {encryptionMethod === "caesar" ? "Shift key (number)" : "Keyword"}:
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="encryption-key"
                          placeholder={encryptionMethod === "caesar" ? "e.g., 3" : "e.g., SECRET"}
                          value={encryptionKey}
                          onChange={(e) => setEncryptionKey(e.target.value)}
                          className="flex-1"
                        />
                        <Button 
                          onClick={() => handleCrypto('encrypt')}
                          className="flex gap-2 items-center"
                        >
                          Encrypt
                        </Button>
                      </div>
                    </div>
                    
                    {encryptionResult && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Encrypted result:</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(encryptionResult)}
                            className="h-8 px-2"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                          {encryptionResult}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-center my-2">
                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Decryption</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="decryption-input">Text to decrypt:</Label>
                      <Input
                        id="decryption-input"
                        placeholder="Enter ciphertext..."
                        value={decryptionInput}
                        onChange={(e) => setDecryptionInput(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="decryption-key">
                        {encryptionMethod === "caesar" ? "Shift key (number)" : "Keyword"}:
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="decryption-key"
                          placeholder={encryptionMethod === "caesar" ? "e.g., 3" : "e.g., SECRET"}
                          value={decryptionKey}
                          onChange={(e) => setDecryptionKey(e.target.value)}
                          className="flex-1"
                        />
                        <Button 
                          onClick={() => handleCrypto('decrypt')}
                          className="flex gap-2 items-center"
                        >
                          Decrypt
                        </Button>
                      </div>
                    </div>
                    
                    {decryptionResult && (
                      <div className="space-y-2">
                        <Label>Decrypted result:</Label>
                        <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                          {decryptionResult}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 text-black mt-4">
                  <p className="font-semibold">Historical Note:</p>
                  <p className="text-sm mt-1">
                    {encryptionMethod === 'caesar' ? 
                      "The Caesar cipher is named after Julius Caesar, who used it to communicate with his generals. It's a simple substitution cipher where each letter is shifted a fixed number of places in the alphabet." : 
                      "The Vigenère cipher was invented in the 16th century and was considered unbreakable for three centuries. It uses a series of different Caesar ciphers based on the letters of a keyword."
                    }
                  </p>
                  <p className="font-semibold mt-3">Security Consideration:</p>
                  <p className="text-sm mt-1">
                    {encryptionMethod === 'caesar' ? 
                      "The Caesar cipher is extremely weak and can be easily broken with brute force by trying all 25 possible shifts." : 
                      "The Vigenère cipher is stronger than simple substitution ciphers but still vulnerable to frequency analysis if the key length can be determined."
                    } For modern security applications, use established encryption algorithms like AES or RSA.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Additional Resources</CardTitle>
              <CardDescription>Learn more about cryptography and secure communications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {(content?.resources || [
                  { name: "What is Cryptographic Hashing?", url: "https://csrc.nist.gov/glossary/term/cryptographic_hash_function" },
                  { name: "Symmetric vs. Asymmetric Encryption", url: "https://www.ssl2buy.com/wiki/symmetric-vs-asymmetric-encryption-what-are-differences" },
                  { name: "OWASP Password Storage Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html" },
                  { name: "Interactive Cryptography Tools", url: "https://cryptii.com/" }
                ]).map((resource: { name: string; url: string }, index: number) => (
                  <a 
                    key={index}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 rounded-md border hover:bg-muted transition-colors"
                  >
                    <div className="flex-1">{resource.name}</div>
                    <ExternalLink className="h-4 w-4 opacity-70" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submit">
          <Card>
            <CardHeader>
              <CardTitle>Complete the Lab</CardTitle>
              <CardDescription>Submit your work to receive credit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose max-w-none">
                <p>Before submitting, make sure you have:</p>
                <ul>
                  <li className={successSteps.includes('hash') ? "text-green-600" : ""}>
                    Generated at least one cryptographic hash
                  </li>
                  <li className={successSteps.includes('encrypt') ? "text-green-600" : ""}>
                    Successfully encrypted a message
                  </li>
                  <li className={successSteps.includes('decrypt') ? "text-green-600" : ""}>
                    Successfully decrypted a message
                  </li>
                </ul>
                
                <div className="bg-blue-50 p-4 rounded-md border border-blue-200 text-blue-800 mt-4">
                  <p className="font-semibold">Key Takeaways:</p>
                  <ul className="mt-2">
                    <li>Hashing is one-way and used for verification (passwords, integrity), not for storing secrets that need to be retrieved.</li>
                    <li>Modern applications should use strong, dedicated password hashing algorithms like Bcrypt, Argon2, or PBKDF2.</li>
                    <li>Classical ciphers (Caesar, Vigenère) are for educational purposes only. Use modern encryption standards like AES for real security.</li>
                    <li>Key management is often the most challenging aspect of cryptography implementation.</li>
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setActiveTab("hashing")}
              >
                Return to Lab
              </Button>
              <Button
                onClick={handleSubmitLab}
                disabled={isSubmitting || isCompleted || !allChallengesComplete}
                className="flex items-center gap-2"
              >
                {isSubmitting ? "Submitting..." : isCompleted ? "Completed" : "Submit Lab"}
                {isCompleted && <CheckCircle className="h-4 w-4" />}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 