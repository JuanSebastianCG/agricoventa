import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import authService, { UserData } from '../services/authService';
import userService from '../services/userService';

// Define the shape of our context state
interface AppContextState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isAuthenticated: boolean;
  user: UserData | null;
  login: (token: string, userData: UserData) => void;
  logout: () => void;
  updateUser: (userData: UserData) => void;
  isLoading: boolean;
}

// Token storage key
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Create the context with a default value
const AppContext = createContext<AppContextState | undefined>(undefined);

// Props for the AppProvider component
interface AppProviderProps {
  children: ReactNode;
}

// Custom hook to use the app context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Función para verificar si hay una sesión guardada
const checkForSavedSession = (): { token: string | null, user: UserData | null } => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    
    if (token && userStr) {
      const userData = JSON.parse(userStr);
      return { token, user: userData };
    }
  } catch (error) {
    console.error('Error al verificar sesión guardada:', error);
  }
  
  return { token: null, user: null };
};

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, setState] = useState<AppContextState>({
    theme: 'light',
    toggleTheme: () => {},
    isAuthenticated: false, // Initialize as false, let useEffect determine based on token
    user: null,
    login: () => {},
    logout: () => {},
    updateUser: () => {},
    isLoading: true
  });
  
  useEffect(() => {
    const initializeUser = async () => {
      const savedSession = checkForSavedSession(); // Check session inside useEffect
      try {
        if (savedSession.token) {
          const currentUser = await userService.getCurrentUser();
          setState(prev => ({
            ...prev,
            isAuthenticated: true,
            user: currentUser,
            isLoading: false
          }));
        } else {
          // No token, so not authenticated, and loading is complete
          setState(prev => ({
            ...prev,
            isAuthenticated: false,
            user: null,
            isLoading: false
          }));
        }
      } catch (error) {
        console.error('Error initializing user session:', error);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setState(prev => ({
          ...prev,
          isAuthenticated: false,
          user: null,
          isLoading: false
        }));
      }
    };

    initializeUser();
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === TOKEN_KEY || event.key === USER_KEY) {
        const session = checkForSavedSession();
        setState(prev => ({
          ...prev,
          isAuthenticated: !!session.token,
          user: session.user,
          isLoading: false // Assuming storage change means loading is done for this context
        }));
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Empty dependency array means this runs once on mount
  
  const toggleTheme = () => {
    setState(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  };
  
  const login = (token: string, userData: UserData) => {
    if (!userData) {
      console.error("Error: userData es undefined en la función login");
      return;
    }
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        user: userData,
        isLoading: false
      }));
    } catch (error) {
      console.error("Error en la función login:", error);
    }
  };
  
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('cart');
    setState(prev => ({
      ...prev,
      isAuthenticated: false,
      user: null,
      isLoading: false
    }));
  };

  const updateUser = (userData: UserData) => {
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setState(prev => ({ ...prev, user: userData }));
  };
  
  const contextValue = {
    theme: state.theme,
    toggleTheme,
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    login,
    logout,
    updateUser,
    isLoading: state.isLoading
  };
  
  if (state.isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-1"></div>
      </div>
    );
  }
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider; 