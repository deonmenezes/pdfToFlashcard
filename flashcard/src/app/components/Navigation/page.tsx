"use client";

import { FC, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Users, LogOut, User, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  getAuth, 
  onAuthStateChanged, 
  signOut 
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { auth } from "../../../../firebaseConfig";

interface NavigationProps {}

const Navigation: FC<NavigationProps> = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Check authentication state
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // User is signed in
        setUser(currentUser);
        
        // Optional: Retrieve additional user data from local storage
        const storedUserData = localStorage.getItem('user');
        if (storedUserData) {
          const parsedUserData = JSON.parse(storedUserData);
          setUser((prevUser: any) => ({
            ...prevUser,
            displayName: parsedUserData.displayName || prevUser.displayName
          }));
        }
      } else {
        // User is signed out
        setUser(null);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
    document.documentElement.classList.toggle("dark");
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      
      // Clear user data from local storage
      localStorage.removeItem('user');
      
      // Show logout toast
      toast.success("Logged out successfully", {
        description: "You have been signed out of your account."
      });
      
      // Redirect to home page
      router.push('/');
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed", {
        description: "An error occurred while logging out."
      });
    }
  };

  const renderAuthButtons = () => {
    if (user) {
      return (
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center space-x-2 cursor-pointer">
                {user.photoURL ? (
                  <Image 
                    src={user.photoURL} 
                    alt="Profile" 
                    width={32} 
                    height={32} 
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center">
                    {user.displayName ? user.displayName[0].toUpperCase() : user.email[0].toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium">
                  {user.displayName || user.email.split('@')[0]}
                </span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                <User className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/profile')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/quizzes')}>
                <Users className="mr-2 h-4 w-4" />
                <span>My Quizzes</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    }
    
    return (
      <>
        <Link href="/login">
          <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
            Login
          </Button>
        </Link>
        <Link href="/signup">
          <Button
            variant="outline"
            className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 border-purple-600 hover:border-purple-700 dark:border-purple-400 dark:hover:border-purple-300"
          >
            Sign Up
          </Button>
        </Link>
      </>
    );
  };

  const renderMenuItems = () => {
    return (
      <>
        <a
          href="#features"
          className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 font-medium"
        >
          Features
        </a>
        <a
          href="#how-it-works"
          className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 font-medium"
        >
          How it Works
        </a>
        <a
          href="#testimonials"
          className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 font-medium"
        >
          Testimonials
        </a>
        <Link
          href="/communities"
          className="flex items-center space-x-1 font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
        >
          <Users className="h-4 w-4" />
          <span>Communities</span>
        </Link>
      </>
    );
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md py-4 px-6 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <div className="relative">
              <Image
                src="/QUIZITT-logo.png"
                alt="Quizitt Logo"
                width={160}
                height={70}
                style={{ objectFit: "contain" }}
                priority
              />
            </div>
          </Link>
        </div>

        <div className="hidden md:flex items-center space-x-8">
          {renderMenuItems()}
          <div className="flex items-center space-x-4">
            {renderAuthButtons()}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="rounded-full h-10 w-10 p-0 flex items-center justify-center"
            >
              {isDarkMode ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-yellow-400"
                >
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-indigo-600"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </Button>
          </div>
        </div>

        <div className="md:hidden flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-gray-800 dark:text-white" />
            ) : (
              <Menu className="h-6 w-6 text-gray-800 dark:text-white" />
            )}
          </Button>
        </div>
      </div>

      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden mt-4 bg-white dark:bg-gray-800 py-2"
        >
          <div className="flex flex-col space-y-3 px-6">
            {renderMenuItems()}
            <div className="flex flex-col space-y-2">
              {user ? (
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2 mb-2">
                    {user.photoURL ? (
                      <Image 
                        src={user.photoURL} 
                        alt="Profile" 
                        width={32} 
                        height={32} 
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center">
                        {user.displayName ? user.displayName[0].toUpperCase() : user.email[0].toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-medium">
                      {user.displayName || user.email.split('@')[0]}
                    </span>
                  </div>
                  <Button 
                    onClick={() => router.push('/dashboard')}
                    className="w-full"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button 
                    onClick={() => router.push('/profile')}
                    className="w-full"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                  <Button 
                    onClick={() => router.push('/quizzes')}
                    className="w-full"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    My Quizzes
                  </Button>
                  <Button 
                    onClick={handleLogout}
                    className="w-full text-red-500 hover:text-red-600 border border-red-300 hover:border-red-400"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <>
                  <Link href="/login">
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 w-full">
                      Login
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button
                      variant="outline"
                      className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 border-purple-600 hover:border-purple-700 dark:border-purple-400 dark:hover:border-purple-300 w-full"
                    >
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
};

export default Navigation;