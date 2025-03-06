"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, Smartphone, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Github, Twitter } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

// Firebase imports
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  GithubAuthProvider,
  TwitterAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../../../firebaseConfig";

// Import Auth Context
import { useAuth } from "@/app/contexts/AuthContext/auth-type";

// OAuth Providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();
const twitterProvider = new TwitterAuthProvider();

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [verificationId, setVerificationId] = useState<string>("");
  const [isResetPassword, setIsResetPassword] = useState(false);
  
  // Get authentication context
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

  // Validation functions
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const validatePhoneNumber = (phone: string) => {
    // Validates 10-digit phone number
    return /^\d{10}$/.test(phone);
  };

  const createOrUpdateUserDocument = async (user: any) => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        // Update last login time
        await setDoc(userDocRef, {
          lastLogin: serverTimestamp()
        }, { merge: true });
        
        const userData = userDoc.data();
        
        // Update global auth state
        setUser({
          uid: user.uid,
          email: user.email || userData.email,
          displayName: user.displayName || userData.displayName,
          phoneNumber: user.phoneNumber || userData.phoneNumber,
          profileCompleted: userData.profileCompleted || false
        });
        
        return userData;
      } else {
        // Create a new user document if it doesn't exist
        const newUserData = {
          uid: user.uid,
          email: user.email,
          phoneNumber: user.phoneNumber || null,
          displayName: user.displayName || user.email?.split('@')[0] || "User",
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          quizzesTaken: 0,
          quizzesCreated: 0,
          profileCompleted: false,
          authMethod: user.phoneNumber ? 'phone' : 'email'
        };
        
        await setDoc(userDocRef, newUserData);
        
        // Update global auth state
        setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || "User",
          phoneNumber: user.phoneNumber || null,
          profileCompleted: false
        });
        
        return newUserData;
      }
    } catch (error) {
      console.error("Error with user document:", error);
      throw error;
    }
  };

  const handleSuccess = async (user: any) => {
    try {
      // Fetch/update user data in Firestore
      const userData = await createOrUpdateUserDocument(user);
      
      // Optional: Store user data in local storage
      localStorage.setItem('user', JSON.stringify(userData));
      
      toast.success("Welcome back!", {
        description: `Logged in as ${userData.displayName || user.email}`
      });
      
      // Redirect to dashboard
      router.push('/');
    } catch (error) {
      console.error("Error handling login success:", error);
      toast.error("Login successful but could not retrieve user details");
      router.push('/');
    }
  };

  const handleError = (error: any) => {
    setLoading(false);
    
    let errorMessage = "An unexpected error occurred. Please try again.";
    let shouldShowPhoneAuth = false;
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = "No account found with this email.";
        break;
      case 'auth/wrong-password':
        errorMessage = "Incorrect password. Please try again.";
        shouldShowPhoneAuth = true;
        break;
      case 'auth/invalid-email':
        errorMessage = "Invalid email address.";
        break;
      case 'auth/too-many-requests':
        errorMessage = "Too many login attempts. Please try again later or use a different login method.";
        shouldShowPhoneAuth = true;
        break;
      case 'auth/multi-factor-auth-required':
        // Handle MFA (if implemented)
        errorMessage = "Multi-factor authentication required.";
        break;
      case 'auth/account-exists-with-different-credential':
        errorMessage = "An account already exists with the same email address but different sign-in credentials.";
        break;
      case 'auth/invalid-credential':
        errorMessage = "Invalid login credentials. Please try again.";
        break;
    }
    
    setError(errorMessage);
    
    toast.error("Login Failed", {
      description: errorMessage
    });
    
    // If appropriate, offer phone authentication as an alternative
    if (shouldShowPhoneAuth && email) {
      checkAuthMethodsAndOffer(email);
    }
  };

  const checkAuthMethodsAndOffer = async (email: string) => {
    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      
      // If user has phone authentication as an option
      if (signInMethods.includes('phone') || signInMethods.length === 0) {
        toast.info("Alternative Login", {
          description: "You can also try logging in with your phone number."
        });
      }
    } catch (error) {
      console.error("Error checking auth methods:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    // Email validation
    if (!validateEmail(email)) {
      setLoading(false);
      setError("Please enter a valid email address");
      toast.error("Invalid Email", {
        description: "Please enter a valid email address"
      });
      return;
    }
    
    try {
      // Attempt to sign in with email and password
      const result = await signInWithEmailAndPassword(auth, email, password);
      await handleSuccess(result.user);
    } catch (error: any) {
      handleError(error);
    }
  };

  const handleOAuthSignIn = async (provider: any) => {
    setLoading(true);
    setError("");
    
    try {
      const result = await signInWithPopup(auth, provider);
      await handleSuccess(result.user);
    } catch (error: any) {
      handleError(error);
    }
  };

  const handlePhoneLogin = () => {
    setStep(2);
    setupRecaptcha();
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
          description: error.message || "Unable to send OTP. Try again later."
        });
      }
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
      try {
        if (confirmationResult) {
          const phoneUserCredential = await confirmationResult.confirm(otp);
          await handleSuccess(phoneUserCredential.user);
        } else {
          throw new Error("No confirmation result");
        }
      } catch (otpError) {
        console.error("OTP confirmation error:", otpError);
        toast.error("OTP Verification Failed", {
          description: "Invalid code or session expired. Please try again."
        });
        setStep(2);
      }
    } catch (error: any) {
      console.error("OTP Verification Error:", error);
      
      if (error.code === 'auth/invalid-verification-code') {
        toast.error("Invalid Code", {
          description: "The verification code you entered is invalid."
        });
      } else if (error.code === 'auth/code-expired') {
        toast.error("Code Expired", {
          description: "The verification code has expired. Please request a new one."
        });
        setStep(2);
      } else {
        toast.error("Verification Failed", {
          description: error.message || "Unable to verify OTP"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (isResetPassword) {
      if (!validateEmail(email)) {
        toast.error("Invalid Email", {
          description: "Please enter a valid email address to reset your password."
        });
        return;
      }
      
      setLoading(true);
      try {
        await sendPasswordResetEmail(auth, email);
        toast.success("Password Reset Email Sent", {
          description: "Check your inbox for instructions to reset your password."
        });
        setIsResetPassword(false);
      } catch (error: any) {
        console.error("Password reset error:", error);
        
        if (error.code === 'auth/user-not-found') {
          toast.error("No Account Found", {
            description: "No account exists with this email address."
          });
        } else {
          toast.error("Reset Failed", {
            description: error.message || "Failed to send password reset email."
          });
        }
      } finally {
        setLoading(false);
      }
    } else {
      setIsResetPassword(true);
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
            {isResetPassword ? "Reset Password" : 
             step === 1 ? "Welcome Back" : 
             step === 2 ? "Login with Phone" : 
             "Verify OTP"}
          </h2>
          <div className="text-center mb-6">
            <p className="text-lg text-gray-700 font-medium">
              Log in to unlock Free Access of QUIZITT's powerful features!
            </p>
           
            <div className="flex items-center justify-center mt-3 text-xs text-purple-600">
              <span className="inline-flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                No credit card required
              </span>
              <span className="mx-2">•</span>
              <span className="inline-flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                Instant access
              </span>
            </div>
          </div>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}
          
          {/* Step 1: Email Password Login */}
          {step === 1 && !isResetPassword && (
            <form onSubmit={handleSubmit} className="space-y-4">
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
              
              <div className="text-right">
                <button 
                  type="button" 
                  className="text-sm text-purple-600 hover:text-purple-700 hover:underline"
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </button>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={handlePhoneLogin}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Login with phone number instead
                </button>
              </div>
            </form>
          )}
          
          {/* Reset Password Form */}
          {step === 1 && isResetPassword && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              
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
              
              <div className="flex space-x-3">
                <Button 
                  type="button" 
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsResetPassword(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                
                <Button 
                  type="button" 
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
                  onClick={handleForgotPassword}
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </div>
            </div>
          )}
          
          {/* Step 2: Phone Number Input */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">
                  Enter your phone number to receive a verification code.
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
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Back to email login
                </button>
              </div>

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

          {/* Social Login Section */}
          {step === 1 && !isResetPassword && (
            <>
              <div className="flex items-center justify-center space-x-4 my-6">
                <div className="h-px bg-gray-300 w-full"></div>
                <span className="text-gray-500 text-sm">or</span>
                <div className="h-px bg-gray-300 w-full"></div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Button 
                  type="button"
                  onClick={() => handleOAuthSignIn(googleProvider)}
                  variant="outline" 
                  className="border-gray-300 hover:bg-gray-50"
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
                </Button>
                <Button 
                  type="button"
                  onClick={() => handleOAuthSignIn(githubProvider)}
                  variant="outline" 
                  className="border-gray-300 hover:bg-gray-50"
                  disabled={loading}
                >
                  <Github className="h-5 w-5" />
                </Button>
                <Button 
                  type="button"
                  onClick={() => handleOAuthSignIn(twitterProvider)}
                  variant="outline" 
                  className="border-gray-300 hover:bg-gray-50"
                  disabled={loading}
                >
                  <Twitter className="h-5 w-5 text-blue-400" />
                </Button>
              </div>

              {/* Signup Link */}
              <div className="text-center mt-6">
                <span className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link 
                    href="/signup" 
                    className="text-purple-600 hover:text-purple-700 hover:underline"
                  >
                    Sign up
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