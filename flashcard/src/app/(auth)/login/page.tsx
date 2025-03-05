"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Github, Twitter } from "lucide-react";
import { toast } from "sonner";

// Firebase imports
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  GithubAuthProvider,
  TwitterAuthProvider
} from "firebase/auth";
import {  doc, getDoc } from "firebase/firestore";
import { auth , db} from "../../../../firebaseConfig";

// Initialize Firebase

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

  const handleSuccess = async (user: any) => {
    // Fetch user additional data from Firestore
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Optional: Store user data in local storage or state management
        localStorage.setItem('user', JSON.stringify(userData));
        
        toast.success("Welcome back!", {
          description: `Logged in as ${userData.displayName || user.email}`
        });
        
        // Redirect to dashboard
        router.push('/');
      } else {
        // Fallback if no user document exists
        toast.error("User profile not found");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Login successful but could not retrieve user details");
      router.push('/dashboard');
    }
  };

  const handleError = (error: any) => {
    setLoading(false);
    
    let errorMessage = "An unexpected error occurred. Please try again.";
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = "No account found with this email.";
        break;
      case 'auth/wrong-password':
        errorMessage = "Incorrect password. Please try again.";
        break;
      case 'auth/invalid-email':
        errorMessage = "Invalid email address.";
        break;
      case 'auth/too-many-requests':
        errorMessage = "Too many login attempts. Please try again later.";
        break;
    }
    
    setError(errorMessage);
    
    toast.error("Login Failed", {
      description: errorMessage
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
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

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Link href="/">
            <img
              src="/QUIZITT-logo.png"
              alt="Quizitt Logo"
              className="mx-auto h-16 w-auto"
            />
          </Link>
        </div>
        
        <div className="mt-8 bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Welcome Back</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
              Login to continue to Quizitt
            </p>
          </div>
          
          {error && (
            <div className="mb-4 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="you@example.com"
                  required
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  placeholder="••••••••"
                  required
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              </div>
            </div>
            
            <div className="text-right">
              <button 
                type="button" 
                className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 font-medium"
              >
                Forgot password?
              </button>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 h-11"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full border-gray-300 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with</span>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-3 gap-3">
              <Button 
                variant="outline" 
                className="border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => handleOAuthSignIn(googleProvider)}
                disabled={loading}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                  <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                    <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                    <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                    <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                    <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                  </g>
                </svg>
              </Button>
              <Button 
                variant="outline" 
                className="border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => handleOAuthSignIn(githubProvider)}
                disabled={loading}
              >
                <Github className="h-4 w-4 text-gray-800 dark:text-white" />
              </Button>
              <Button 
                variant="outline" 
                className="border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => handleOAuthSignIn(twitterProvider)}
                disabled={loading}
              >
                <Twitter className="h-4 w-4 text-blue-400" />
              </Button>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?
              <Link 
                href="/signup" 
                className="ml-1 font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}