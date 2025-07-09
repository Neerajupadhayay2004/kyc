import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          is_verified: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          last_login: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          is_verified?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          is_verified?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
        };
      };
      kyc_applications: {
        Row: {
          id: string;
          user_id: string;
          application_number: string;
          status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'expired';
          current_step: number;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          date_of_birth: string;
          nationality: string;
          address: string;
          city: string;
          country: string;
          postal_code: string;
          risk_score: number;
          risk_level: 'low' | 'medium' | 'high';
          submitted_at: string | null;
          reviewed_at: string | null;
          approved_at: string | null;
          rejected_at: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
          reviewed_by: string | null;
          rejection_reason: string | null;
          admin_notes: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          application_number?: string;
          status?: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'expired';
          current_step?: number;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          date_of_birth: string;
          nationality: string;
          address: string;
          city: string;
          country: string;
          postal_code: string;
          risk_score?: number;
          risk_level?: 'low' | 'medium' | 'high';
          submitted_at?: string | null;
          reviewed_at?: string | null;
          approved_at?: string | null;
          rejected_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
          reviewed_by?: string | null;
          rejection_reason?: string | null;
          admin_notes?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          application_number?: string;
          status?: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'expired';
          current_step?: number;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string;
          date_of_birth?: string;
          nationality?: string;
          address?: string;
          city?: string;
          country?: string;
          postal_code?: string;
          risk_score?: number;
          risk_level?: 'low' | 'medium' | 'high';
          submitted_at?: string | null;
          reviewed_at?: string | null;
          approved_at?: string | null;
          rejected_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
          reviewed_by?: string | null;
          rejection_reason?: string | null;
          admin_notes?: string | null;
        };
      };
    };
  };
}