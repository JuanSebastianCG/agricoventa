import { AxiosError } from 'axios';
import api from './api';

// API URL for auth endpoints - fix to avoid duplicate /api in the path
const API_URL = '/auth';

// Types
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  userType?: 'SELLER' | 'BUYER' | 'ADMIN';
  location?: {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    department?: string;
    country?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface LoginData {
  username: string;
  password: string;
  remember?: boolean;
}

export interface UserData {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  userType?: string;
  isActive?: boolean;
  profileImage?: string;
  phoneNumber?: string;
  primaryLocationId?: string;
  subscriptionType?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginResponse {
  user: UserData;
  token: string;
}

// Token storage key
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Auth Service
const authService = {
  // Register new user
  async register(data: RegisterData): Promise<UserData> {
    try {
      const response = await api.post(`${API_URL}/register`, data);
      
      // Manejar la estructura de respuesta anidada
      const userData = response.data.data?.user || response.data.user || response.data;
      return userData;
    } catch (error) {
      console.error('authService - Error en registro:', error);
      const axiosError = error as AxiosError;
      throw axiosError;
    }
  },

  // Login user
  async login(data: LoginData): Promise<LoginResponse> {
    try {
      console.log(`Sending login request to ${API_URL}/login with data:`, JSON.stringify({
        username: data.username,
        password: '********',
        remember: data.remember
      }));
      
      const response = await api.post(`${API_URL}/login`, data);
      console.log('Login API response:', response.data);
      
      // Extract data from response
      const responseData = response.data;
      const dataContainer = responseData.data || responseData;
      
      // Extract token and user data
      const token = dataContainer.token;
      const user = dataContainer.user;
      
      // Validate response
      if (!token) {
        throw new Error('Invalid server response: missing authentication token');
      }
      
      if (!user) {
        throw new Error('Invalid server response: missing user data');
      }
      
      // Ensure user has required properties
      const userData: UserData = {
        id: user.id,
        username: user.username,
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        userType: user.userType,
        isActive: user.isActive,
        profileImage: user.profileImage,
        phoneNumber: user.phoneNumber,
        primaryLocationId: user.primaryLocationId,
        subscriptionType: user.subscriptionType,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
      
      // Store token and user data
      localStorage.setItem(TOKEN_KEY, token.trim());
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      
      return {
        token,
        user: userData
      };
    } catch (error) {
      console.error('authService - Login error:', error);
      // Just pass through the AxiosError to maintain all error properties
      throw error;
    }
  },

  // Logout user
  logout(): void {
    // Clear all auth data
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  },

  // Get current user
  getCurrentUser(): UserData | null {
    try {
      // Check localStorage for user data
      const userStr = localStorage.getItem(USER_KEY);
      
      if (userStr) {
        const userData = JSON.parse(userStr);
        return userData;
      }
      return null;
    } catch (e) {
      console.error('authService - Error al obtener el usuario actual:', e);
      return null;
    }
  },

  // Check if user is logged in
  isLoggedIn(): boolean {
    const isLogged = !!this.getToken();
    return isLogged;
  },

  // Get auth token
  getToken(): string | null {
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? token.trim() : null;
  }
};

// Helper function to parse API errors
const parseApiError = (error: AxiosError): any => {
  if (error.response) {
    console.error('authService - Error de respuesta API:', error.response.status, error.response.data);
    const errorData = error.response.data as Record<string, any>;
    
    // Handle nested error structure
    if (errorData.error && errorData.error.errors) {
      return { 
        status: error.response.status,
        message: errorData.error.message || 'Error de validación',
        errors: errorData.error.errors 
      };
    }
    
    // Handle standard error structure
    // Manejar posibles estructuras de error (directa o anidada)
    return errorData.data?.error || errorData.error || errorData.message || errorData;
  }
  console.error('authService - Error de conexión:', error.message);
  return { message: error.message || 'Error de conexión con el servidor' };
};

export default authService; 