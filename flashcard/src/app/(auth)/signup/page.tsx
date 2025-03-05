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

  const router = useRouter();
  const googleProvider = new GoogleAuthProvider();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const recaptchaContainer = document.getElementById('recaptcha-container');
      
      if (recaptchaContainer) {
        if ((window as any).recaptchaVerifier) {
          (window as any).recaptchaVerifier.clear();
        }
  
        const verifier = new RecaptchaVerifier(auth, recaptchaContainer, {
          'size': 'invisible',
          'callback': (response: any) => {
            console.log('Recaptcha solved');
          },
          'error-callback': (error: any) => {
            console.error('Recaptcha error', error);
          }
        });
  
        (window as any).recaptchaVerifier = verifier;
      }
    }
  
    return () => {
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
      }
    };
  }, []);

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
        phoneNumber: phoneNumber,
        displayName: displayName || user.displayName || user.email.split('@')[0],
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        quizzesTaken: 0,
        quizzesCreated: 0,
        profileCompleted: false,
        authMethod: 'email-phone'
      }, { merge: true });
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
        return;
      }

      // Check if email already exists
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      if (signInMethods.length > 0) {
        toast.error("Account Already Exists", {
          description: "An account with this email already exists. Please log in or use a different email."
        });
        return;
      }

      // If all validations pass, move to phone verification
      setStep(2);

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
      // Validate phone number
      if (!validatePhoneNumber(phoneNumber)) {
        toast.error("Invalid Phone Number", {
          description: "Please enter a valid 10-digit phone number"
        });
        return;
      }

      const phoneNumberWithCode = '+91' + phoneNumber; // Assuming Indian phone numbers
      const recaptchaVerifier = (window as any).recaptchaVerifier;
      
      const result = await signInWithPhoneNumber(auth, phoneNumberWithCode, recaptchaVerifier);
      setConfirmationResult(result);
      
      toast.success("OTP Sent", {
        description: "Verification code sent to your phone"
      });
      
      setStep(3);
    } catch (error: any) {
      console.error("Phone Auth Error:", error);
      toast.error("OTP Send Failed", {
        description: error.message || "Unable to send OTP"
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    setLoading(true);
    try {
      if (!confirmationResult) {
        throw new Error("No confirmation result");
      }

      // Validate OTP
      if (!otp || otp.length !== 6) {
        toast.error("Invalid OTP", {
          description: "Please enter a 6-digit OTP"
        });
        return;
      }
  
      // Verify phone number
      const userCredential: UserCredential = await confirmationResult.confirm(otp);
      
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
  
      // Redirect to login page
      router.push('/login');

    } catch (error: any) {
      console.error("OTP Verification Error:", error);
      
      // Handle specific error cases
      if (error.code === 'auth/email-already-in-use') {
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
    try {
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
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-100 px-4 py-8">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl overflow-hidden">
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
                {loading ? "Processing..." : "Next"}
              </Button>
            </form>
          )}

          {/* Step 2: Phone Number */}
          {step === 2 && (
            <div className="space-y-4">
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
                className="h-0 overflow-hidden"
              ></div>
            </div>
          )}

          {/* Step 3: OTP Verification */}
          {step === 3 && (
            <div className="space-y-4">
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

              <div className="text-center">
                <button 
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-sm text-blue-500 hover:text-blue-700 hover:underline"
                >
                  Resend OTP
                </button>
              </div>
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

