"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../../firebaseConfig';
// Define user type
type UserType = {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber: string | null;
  profileCompleted: boolean;
} | null;
// Define context type
type AuthContextType = {
  user: UserType;
  loading: boolean;
  setUser: (user: UserType) => void;
  signOut: () => Promise<void>;
};
// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  signOut: async () => {},
});
// Custom hook for using the auth context
export const useAuth = () => useContext(AuthContext);
// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserType>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // Get additional user data from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();

            // Set combined user data
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: userData.displayName || firebaseUser.displayName,
              phoneNumber: userData.phoneNumber || firebaseUser.phoneNumber,
              profileCompleted: userData.profileCompleted || false
            });
          } else {
            // If no Firestore document exists yet, use basic Firebase user data
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              phoneNumber: firebaseUser.phoneNumber,
              profileCompleted: false
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          // Fallback to basic user data if Firestore fetch fails
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            phoneNumber: firebaseUser.phoneNumber,
            profileCompleted: false
          });
        }
      } else {
        // User is signed out
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Sign out function
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // User state will be updated by the onAuthStateChanged listener
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  // Provide auth context value
  const value = {
    user,
    loading,
    setUser,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : null}
    </AuthContext.Provider>
  );
};

export default AuthProvider;