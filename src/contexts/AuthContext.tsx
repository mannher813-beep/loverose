import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signOut, 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  OAuthProvider
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { dbService } from '../services/db';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<any>;
  registerUser: (email: string, pass: string) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  loginWithApple: () => Promise<any>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!auth.currentUser) {
      setUserProfile(null);
      return;
    }
    const profile = await dbService.getUserProfile(auth.currentUser.uid);
    if (profile) {
      setUserProfile(profile);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          // Fetch or create user document via dbService
          const profile = await dbService.getUserProfile(user.uid);
          
          if (profile) {
            setUserProfile(profile);
            // Update online status
            await dbService.updateUserProfile(user.uid, {
              online: true,
              lastSeen: new Date().toISOString()
            }).catch(e => console.warn("Could not update online status", e));
          } else {
            // Initialize empty profile
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'Nouveau membre',
              photos: [user.photoURL || 'https://picsum.photos/seed/loverose/200/200'],
              interests: ['Voyage', 'Cuisine', 'Technologie'],
              languages: ['Français'],
              isPremium: false,
              isVip: false,
              isVerified: false,
              verificationLevel: 1,
              role: 'user',
              online: true,
              createdAt: new Date().toISOString(),
              lastSeen: new Date().toISOString()
            };
            await dbService.saveUserProfile(newProfile);
            setUserProfile(newProfile);
          }
        } catch (error) {
          console.error("Error loading user profile:", error);
          // Fallback user profile to avoid blocking the user if databases have issues
          const fallbackProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'Utilisateur LoveRose',
            photos: [user.photoURL || 'https://picsum.photos/seed/loverose/200/200'],
            interests: ['Voyage', 'Cuisine', 'Technologie'],
            languages: ['Français'],
            isPremium: true,
            isVip: false,
            isVerified: true,
            verificationLevel: 2,
            role: 'user',
            online: true,
            createdAt: new Date().toISOString(),
            lastSeen: new Date().toISOString()
          };
          setUserProfile(fallbackProfile);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };

  const registerUser = (email: string, pass: string) => {
    return createUserWithEmailAndPassword(auth, email, pass);
  };

  const loginWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const loginWithApple = () => {
    const provider = new OAuthProvider('apple.com');
    return signInWithPopup(auth, provider);
  };

  const logout = async () => {
    if (currentUser) {
      await dbService.updateUserProfile(currentUser.uid, {
        online: false,
        lastSeen: new Date().toISOString()
      }).catch(() => {});
    }
    await signOut(auth);
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    await dbService.updateUserProfile(currentUser.uid, data);
    setUserProfile(prev => prev ? { ...prev, ...data } : null);
  };


  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfile,
      loading,
      login,
      registerUser,
      loginWithGoogle,
      loginWithApple,
      logout,
      refreshProfile,
      updateProfileData
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
