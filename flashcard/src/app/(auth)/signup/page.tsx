"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  UserCredential,
  sendEmailVerification,
  fetchSignInMethodsForEmail
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../../../../firebaseConfig";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  User, 
  Key,
  Smartphone
} from "lucide-react";

// Add Auth Context import for global authentication state
import { useAuth } from "@/app/contexts/AuthContext/auth-type"; // You'll need to create this context

export default function SignUpPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [verificationId, setVerificationId] = useState<string>("");

  const router = useRouter();
  const googleProvider = new GoogleAuthProvider();
  
  // Get authentication context (you'll need to create this)
  const { setUser } = useAuth();

  useEffect(() => {
    // Set up recaptcha verifier when component mounts
    setupRecaptcha();
    
    return () => {
      // Clean up recaptcha when component unmounts
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
      }
    };
  }, []);

  const setupRecaptcha = () => {
    if (typeof window !== 'undefined') {
      const recaptchaContainer = document.getElementById('recaptcha-container');
      
      if (recaptchaContainer) {
        // Clear existing recaptcha if any
        if ((window as any).recaptchaVerifier) {
          (window as any).recaptchaVerifier.clear();
        }
  
        try {
          // Create new recaptcha verifier
          const verifier = new RecaptchaVerifier(auth, recaptchaContainer, {
            'size': 'invisible',
            'callback': (response: any) => {
              console.log('Recaptcha solved');
            },
            'error-callback': (error: any) => {
              console.error('Recaptcha error', error);
              toast.error("Recaptcha Error", {
                description: "Please refresh the page and try again"
              });
            }
          });
          
          (window as any).recaptchaVerifier = verifier;
        } catch (error) {
          console.error("Error setting up recaptcha:", error);
        }
      }
    }
  };

  // Comprehensive validation functions
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const validatePassword = (password: string) => {
    // At least 8 characters, one uppercase, one lowercase, one number, and one special character
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return re.test(password);
  };

  const validatePhoneNumber = (phone: string) => {
    // Validates 10-digit phone number
    return /^\d{10}$/.test(phone);
  };

  const createUserDocument = async (user: any) => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        phoneNumber: phoneNumber || user.phoneNumber || null,
        displayName: displayName || user.displayName || user.email?.split('@')[0] || "User",
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        quizzesTaken: 0,
        quizzesCreated: 0,
        profileCompleted: false,
        authMethod: phoneNumber ? 'email-phone' : 'email-only'
      }, { merge: true });
      
      // Update global auth state
      setUser({
        uid: user.uid,
        email: user.email,
        displayName: displayName || user.displayName || user.email?.split('@')[0] || "User",
        phoneNumber: phoneNumber || user.phoneNumber || null,
        profileCompleted: false,
        photoURL: null,
        metadata: {
          creationTime: undefined,
          lastSignInTime: undefined
        }
      });
      
      return true;
    } catch (error) {
      console.error("Error creating user document:", error);
      throw error;
    }
  };

  const handleFirstStepSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Comprehensive validation with specific error messages
      let isValid = true;

      // Display Name Validation
      if (!displayName || displayName.trim().length < 2) {
        toast.error("Invalid Display Name", {
          description: "Display name must be at least 2 characters long"
        });
        isValid = false;
      }

      // Email Validation
      if (!email) {
        toast.error("Email Required", {
          description: "Please enter an email address"
        });
        isValid = false;
      } else if (!validateEmail(email)) {
        toast.error("Invalid Email", {
          description: "Please enter a valid email address"
        });
        isValid = false;
      }

      // Password Validation
      if (!password) {
        toast.error("Password Required", {
          description: "Please enter a password"
        });
        isValid = false;
      } else if (!validatePassword(password)) {
        toast.error("Weak Password", {
          description: "Password must be at least 8 characters, include uppercase, lowercase, number, and special character"
        });
        isValid = false;
      }

      // Confirm Password Validation
      if (!confirmPassword) {
        toast.error("Confirm Password Required", {
          description: "Please confirm your password"
        });
        isValid = false;
      } else if (password !== confirmPassword) {
        toast.error("Passwords Do Not Match", {
          description: "Please ensure both passwords are the same"
        });
        isValid = false;
      }

      // If any validation fails, stop here
      if (!isValid) {
        setLoading(false);
        return;
      }

      // Check if email already exists
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      if (signInMethods.length > 0) {
        toast.error("Account Already Exists", {
          description: "An account with this email already exists. Please log in or use a different email."
        });
        setLoading(false);
        return;
      }

      // Two options for signup flow:
      // 1. With phone verification (current flow)
      // 2. Direct signup without phone (as a fallback)
      
      try {
        // First try the direct signup method
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Send email verification
        await sendEmailVerification(userCredential.user);
        
        // Create user document
        await createUserDocument(userCredential.user);
        
        // Success toast
        toast.success("Account Created!", {
          description: "A verification email has been sent. Please check your inbox.",
          duration: 5000
        });
        
        // Redirect to dashboard or homepage
        router.push('/');
      } catch (emailError) {
        console.error("Email signup failed, trying phone verification:", emailError);
        // If direct email signup fails, move to phone verification
        setStep(2);
      }

    } catch (error: any) {
      console.error("First Step Submit Error:", error);
      
      toast.error("Signup Error", {
        description: error.message || "An unexpected error occurred during signup"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendOTP = async () => {
    setLoading(true);
    try {
      // Reset recaptcha to avoid errors
      setupRecaptcha();
      
      // Validate phone number
      if (!validatePhoneNumber(phoneNumber)) {
        toast.error("Invalid Phone Number", {
          description: "Please enter a valid 10-digit phone number"
        });
        setLoading(false);
        return;
      }

      const phoneNumberWithCode = '+91' + phoneNumber; // Assuming Indian phone numbers
      const recaptchaVerifier = (window as any).recaptchaVerifier;
      
      if (!recaptchaVerifier) {
        toast.error("Recaptcha Error", {
          description: "Please refresh the page and try again"
        });
        setLoading(false);
        return;
      }
      
      // Send OTP to phone number
      const result = await signInWithPhoneNumber(auth, phoneNumberWithCode, recaptchaVerifier);
      setConfirmationResult(result);
      setVerificationId(result.verificationId);
      
      toast.success("OTP Sent", {
        description: "Verification code sent to your phone"
      });
      
      setStep(3);
    } catch (error: any) {
      console.error("Phone Auth Error:", error);
      
      if (error.code === 'auth/invalid-phone-number') {
        toast.error("Invalid Phone Number", {
          description: "Please check the phone number format"
        });
      } else if (error.code === 'auth/too-many-requests') {
        toast.error("Too Many Attempts", {
          description: "Too many failed attempts. Please try again later."
        });
      } else {
        toast.error("OTP Send Failed", {
          description: error.message || "Unable to send OTP. Try direct signup."
        });
        
        // Fallback to direct signup
        handleDirectSignup();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDirectSignup = async () => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Send email verification
      await sendEmailVerification(userCredential.user);
      
      // Create user document
      await createUserDocument(userCredential.user);
      
      // Success toast
      toast.success("Account Created!", {
        description: "A verification email has been sent. Please check your inbox.",
        duration: 5000
      });
      
      // Redirect to dashboard or homepage
      router.push('/');
    } catch (error: any) {
      console.error("Direct Signup Error:", error);
      toast.error("Signup Failed", {
        description: error.message || "An error occurred during signup"
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    setLoading(true);
    try {
      // Validate OTP
      if (!otp || otp.length !== 6) {
        toast.error("Invalid OTP", {
          description: "Please enter a 6-digit OTP"
        });
        setLoading(false);
        return;
      }
      
      if (!confirmationResult && !verificationId) {
        toast.error("Verification Error", {
          description: "Session expired. Please try again."
        });
        setStep(2); // Go back to phone number step
        setLoading(false);
        return;
      }
  
      // Verify phone number
      let phoneUserCredential;
      
      try {
        // Try to confirm with the confirmation result object
        if (confirmationResult) {
          phoneUserCredential = await confirmationResult.confirm(otp);
        } else {
          // Fallback to direct signup
          throw new Error("No confirmation result");
        }
      } catch (otpError) {
        console.error("OTP confirmation error:", otpError);
        toast.error("OTP Verification Failed", {
          description: "Invalid code or session expired. Trying direct signup..."
        });
        
        // Fallback to direct signup
        await handleDirectSignup();
        return;
      }
      
      // If we get here, phone verification successful
      try {
        // Create user with email and password
        const emailUserCredential = await createUserWithEmailAndPassword(
          auth, 
          email, 
          password
        );
        
        // Send email verification
        await sendEmailVerification(emailUserCredential.user);
        
        // Create user document in Firestore
        await createUserDocument(emailUserCredential.user);
        
        // Success toast and redirect
        toast.success("Account Created!", {
          description: "A verification email has been sent. Please check your inbox.",
          duration: 5000
        });
        
        // Redirect to homepage or dashboard
        router.push('/');
      } catch (emailSignupError) {
        console.error("Email signup after phone verification failed:", emailSignupError);
        
        // If email signup fails but phone verification succeeded
        if (phoneUserCredential) {
          // Create user document with phone user credential
          await createUserDocument(phoneUserCredential.user);
          
          toast.success("Account Created with Phone!", {
            description: "You've been signed up with your phone number.",
            duration: 5000
          });
          
          // Redirect to homepage or dashboard
          router.push('/');
        } else {
          throw emailSignupError;
        }
      }

    } catch (error: any) {
      console.error("OTP Verification Error:", error);
      
      // Handle specific error cases
      if (error.code === 'auth/invalid-verification-code') {
        toast.error("Invalid Code", {
          description: "The verification code you entered is invalid."
        });
      } else if (error.code === 'auth/code-expired') {
        toast.error("Code Expired", {
          description: "The verification code has expired. Please request a new one."
        });
        setStep(2); // Go back to phone step
      } else if (error.code === 'auth/email-already-in-use') {
        toast.error("Email Already Exists", {
          description: "An account with this email already exists. Please log in or use a different email."
        });
      } else {
        toast.error("Verification Failed", {
          description: error.message || "Unable to verify OTP"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      // Reset recaptcha to avoid errors
      setupRecaptcha();
      
      // Signin with Google popup
      const result = await signInWithPopup(auth, googleProvider);
      
      // Create user document in Firestore
      await createUserDocument(result.user);

      // Success toast and redirect
      toast.success("Google Sign Up Successful!", {
        description: "You've been signed up with Google. Redirecting...",
        duration: 2000
      });

      // Redirect to dashboard after a short delay
      router.push('/');

    } catch (error: any) {
      console.error("Google Sign Up Error:", error);
      
      const errorCode = error.code;
      
      switch(errorCode) {
        case 'auth/account-exists-with-different-credential':
          toast.error("Email Already Exists", {
            description: "An account with this email already exists with a different login method."
          });
          break;
        case 'auth/popup-blocked':
          toast.error("Popup Blocked", {
            description: "Please allow popups for Google Sign Up."
          });
          break;
        default:
          toast.error("Google Sign Up Failed", {
            description: error.message || "An unexpected error occurred."
          });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-100 px-4 py-8">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl overflow-hidden">
        <div className="flex justify-center mt-6">
          <Image 
            src="/QUIZITT-logo.png" 
            alt="QUIZITT Logo" 
            width={180} 
            height={60} 
            priority
          />
        </div>
        
        <div className="p-8">
          <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-6">
            {step === 1 ? "Create Your Account" : 
            step === 2 ? "Verify Phone Number" : 
            "Verify OTP"}
          </h2>
          
          {/* Step 1: Account Details */}
          {step === 1 && (
            <form onSubmit={handleFirstStepSubmit} className="space-y-4">
              {/* Display Name Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <Input 
                  type="text" 
                  placeholder="Display Name" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-10 w-full"
                  required
                  minLength={2}
                />
              </div>

              {/* Email Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input 
                  type="email" 
                  placeholder="Email Address" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 w-full"
                  required
                  minLength={8}
                />
                <div 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400" />
                </div>
                <Input 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="Confirm Password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 w-full"
                  required
                />
                <div 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
              
              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
                disabled={loading}
              >
                {loading ? "Processing..." : "Sign Up"}
              </Button>
            </form>
          )}

          {/* Step 2: Phone Number */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">
                  Phone verification improves account security.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Skip this step? <button
                    type="button"
                    onClick={handleDirectSignup}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Continue with email only
                  </button>
                </p>
              </div>
            
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Smartphone className="h-5 w-5 text-gray-400" />
                </div>

                <Input 
                  type="tel" 
                  placeholder="Phone Number (10 digits)" 
                  value={phoneNumber}
                  onChange={(e) => {
                    // Only allow numeric input
                    const numericValue = e.target.value.replace(/\D/g, '');
                    setPhoneNumber(numericValue);
                  }}
                  className="pl-10 w-full"
                  maxLength={10}
                />
              </div>
              
              <Button 
                type="button"
                onClick={sendOTP}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
                disabled={loading || phoneNumber.length !== 10}
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </Button>

              <div 
                id="recaptcha-container" 
                className="flex justify-center mt-2"
              ></div>
            </div>
          )}

          {/* Step 3: OTP Verification */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">
                  Enter the 6-digit code sent to +91 {phoneNumber}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Didn't receive code? <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Try again
                  </button> or <button
                    type="button"
                    onClick={handleDirectSignup}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    skip verification
                  </button>
                </p>
              </div>
            
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400" />
                </div>
                <Input 
                  type="text" 
                  placeholder="Enter 6-digit OTP" 
                  value={otp}
                  onChange={(e) => {
                    // Only allow numeric input
                    const numericValue = e.target.value.replace(/\D/g, '');
                    setOtp(numericValue);
                  }}
                  className="pl-10 w-full"
                  maxLength={6}
                />
              </div>
              
              <Button 
                type="button"
                onClick={verifyOTP}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
                disabled={loading || otp.length !== 6}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>
            </div>
          )}

          {/* Divider */}
          {step === 1 && (
            <>
              <div className="flex items-center justify-center space-x-4 my-6">
                <div className="h-px bg-gray-300 w-full"></div>
                <span className="text-gray-500 text-sm">or</span>
                <div className="h-px bg-gray-300 w-full"></div>
              </div>

              {/* Google Sign Up */}
              <Button 
                type="button"
                onClick={handleGoogleSignUp}
                variant="outline" 
                className="w-full flex items-center justify-center space-x-2 border-gray-300 hover:bg-gray-50"
                disabled={loading}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 48 48" 
                >
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.958l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                </svg>
                <span>Sign up with Google</span>
              </Button>

              {/* Login Link */}
              <div className="text-center mt-4">
                <span className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link 
                    href="/login" 
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Log in
                  </Link>
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}