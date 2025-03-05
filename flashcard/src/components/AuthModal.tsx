"use client";

import { FC, useState } from "react";
import { Users, Mail, Lock, Github, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner"; // Changed from shadcn toast to sonner
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  GithubAuthProvider,
  TwitterAuthProvider,
  sendPasswordResetEmail
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

// Firebase configuration - replace with your config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();
const twitterProvider = new TwitterAuthProvider();

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'signup';
  onToggleMode: () => void;
  onAuthSuccess?: (user: any) => void;
}

const AuthModal: FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  mode, 
  onToggleMode,
  onAuthSuccess 
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setError("");
  };

  const handleSuccess = async (user: any) => {
    if (onAuthSuccess) onAuthSuccess(user);
    resetForm();
    onClose();
    
    // Changed to use sonner toast
    toast.success(
      mode === "login" ? "Welcome back!" : "Account created successfully!",
      { description: "You are now logged in." }
    );
  };

  const handleError = (error: any) => {
    console.error("Auth error:", error);
    setLoading(false);
    
    let errorMessage = "An unexpected error occurred. Please try again.";
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = "This email is already in use.";
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = "Invalid email address.";
    } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      errorMessage = "Invalid email or password.";
    } else if (error.code === 'auth/weak-password') {
      errorMessage = "Password should be at least 6 characters.";
    }
    
    setError(errorMessage);
    
    // Changed to use sonner toast
    toast.error("Authentication failed", {
      description: errorMessage
    });
  };

  const saveUserData = async (user: any) => {
    try {
      // Store additional user data in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: name || user.displayName || email.split('@')[0],
        photoURL: user.photoURL || null,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error saving user data:", error);
    }
  };

  const handleEmailPasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      if (mode === "signup") {
        // Create new user
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await saveUserData(result.user);
        await handleSuccess(result.user);
      } else {
        // Log in existing user
        const result = await signInWithEmailAndPassword(auth, email, password);
        await handleSuccess(result.user);
      }
    } catch (error: any) {
      handleError(error);
    }
  };

  const handleOAuthSignIn = async (provider: any) => {
    setLoading(true);
    setError("");
    
    try {
      const result = await signInWithPopup(auth, provider);
      
      // Check if this is a new user
      const userDoc = await getDoc(doc(db, "users", result.user.uid));
      if (!userDoc.exists()) {
        await saveUserData(result.user);
      }
      
      await handleSuccess(result.user);
    } catch (error: any) {
      handleError(error);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    
    try {
      await sendPasswordResetEmail(auth, email);
      
      // Changed to use sonner toast
      toast.success("Password reset email sent", {
        description: "Check your inbox for instructions."
      });
    } catch (error: any) {
      handleError(error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-xl bg-white dark:bg-gray-900 p-0 overflow-hidden">
        <div className="relative h-16 bg-gradient-to-r from-blue-500 to-purple-600">
          <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 rounded-full p-1 bg-white dark:bg-gray-900">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
          </div>
        </div>
        
        <div className="px-6 pt-12 pb-6">
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-bold text-gray-800 dark:text-white">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </DialogTitle>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
              {mode === "login" 
                ? "Login to continue to Quizitt" 
                : "Sign up to start creating and joining quizzes"}
            </p>
          </DialogHeader>
          
          {error && (
            <div className="mt-4 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleEmailPasswordAuth} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                <div className="relative">
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    placeholder="John Doe"
                    required
                  />
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                </div>
              </div>
            )}
            
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
            
            {mode === "login" && (
              <div className="text-right">
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 font-medium"
                >
                  Forgot password?
                </button>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 h-11"
              disabled={loading}
            >
              {loading 
                ? "Processing..." 
                : mode === "login" ? "Login" : "Create Account"}
            </Button>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full border-gray-300 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">Or continue with</span>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-3 gap-3">
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
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}
              <button 
                type="button"
                onClick={() => {
                  resetForm();
                  onToggleMode();
                }} 
                className="ml-1 font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400"
              >
                {mode === "login" ? "Sign up" : "Login"}
              </button>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;