import { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, getUserRole } from '../config/firebase';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userRole = getUserRole(firebaseUser.email);
        setUser(firebaseUser);
        setRole(userRole);
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userRole = getUserRole(userCredential.user.email);

      if (!userRole) {
        // User authenticated but not authorized (not worker or admin)
        await signOut(auth);
        throw new Error('Unauthorized account. Please contact the administrator.');
      }

      setUser(userCredential.user);
      setRole(userRole);
      return { success: true, role: userRole };
    } catch (err) {
      let errorMessage = 'Failed to login. Please try again.';

      // Handle specific Firebase auth errors
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password.';
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      setUser(null);
      setRole(null);
      return { success: true };
    } catch (err) {
      const errorMessage = 'Failed to logout. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Helper booleans
  const isAuthenticated = !!user;
  const isAdmin = role === 'admin';
  const isWorker = role === 'worker';

  const value = {
    user,
    role,
    loading,
    error,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    isWorker,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
