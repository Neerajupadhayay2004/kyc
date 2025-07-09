import { supabase } from '../lib/supabase';
import { auditLog } from './audit';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export class AuthService {
  static async login(credentials: LoginCredentials) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;

      // Log successful login
      if (data.user) {
        await auditLog({
          userId: data.user.id,
          action: 'LOGIN_SUCCESS',
          details: { email: credentials.email }
        });

        // Update last login timestamp
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id);
      }

      return { user: data.user, session: data.session };
    } catch (error: any) {
      // Log failed login attempt
      await auditLog({
        action: 'LOGIN_FAILED',
        details: { email: credentials.email, error: error.message }
      });
      throw error;
    }
  }

  static async register(userData: RegisterData) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            phone: userData.phone,
          }
        }
      });

      if (error) throw error;

      // Log successful registration
      if (data.user) {
        await auditLog({
          userId: data.user.id,
          action: 'REGISTER_SUCCESS',
          details: { email: userData.email }
        });
      }

      return { user: data.user, session: data.session };
    } catch (error: any) {
      // Log failed registration
      await auditLog({
        action: 'REGISTER_FAILED',
        details: { email: userData.email, error: error.message }
      });
      throw error;
    }
  }

  static async logout() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Log logout
      if (user) {
        await auditLog({
          userId: user.id,
          action: 'LOGOUT',
          details: {}
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  static async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;

      await auditLog({
        action: 'PASSWORD_RESET_REQUEST',
        details: { email }
      });
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}