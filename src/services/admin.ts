import { supabase } from '../lib/supabase';
import { auditLog } from './audit';

export interface AdminStats {
  totalApplications: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  todaySubmissions: number;
}

export class AdminService {
  static async getStats(): Promise<AdminStats> {
    try {
      const { data: applications, error } = await supabase
        .from('kyc_applications')
        .select('status, created_at');

      if (error) throw error;

      const today = new Date().toDateString();
      
      const stats: AdminStats = {
        totalApplications: applications.length,
        pendingReview: applications.filter(app => app.status === 'under_review').length,
        approved: applications.filter(app => app.status === 'approved').length,
        rejected: applications.filter(app => app.status === 'rejected').length,
        todaySubmissions: applications.filter(app => 
          new Date(app.created_at).toDateString() === today
        ).length
      };

      return stats;
    } catch (error) {
      console.error('Get admin stats error:', error);
      throw error;
    }
  }

  static async getAllApplications(page = 1, limit = 20, status?: string) {
    try {
      let query = supabase
        .from('kyc_applications')
        .select(`
          *,
          kyc_documents (*),
          kyc_facial_data (*),
          users (email, first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data: applications, error } = await query;
      if (error) throw error;

      return applications;
    } catch (error) {
      console.error('Get all applications error:', error);
      throw error;
    }
  }

  static async reviewApplication(applicationId: string, action: 'approve' | 'reject', adminId: string, notes?: string) {
    try {
      const status = action === 'approve' ? 'approved' : 'rejected';
      const timestamp = new Date().toISOString();

      const updateData: any = {
        status,
        reviewed_by: adminId,
        reviewed_at: timestamp,
        admin_notes: notes || null
      };

      if (action === 'approve') {
        updateData.approved_at = timestamp;
      } else {
        updateData.rejected_at = timestamp;
        updateData.rejection_reason = notes;
      }

      const { data: application, error } = await supabase
        .from('kyc_applications')
        .update(updateData)
        .eq('id', applicationId)
        .select()
        .single();

      if (error) throw error;

      await auditLog({
        userId: adminId,
        applicationId,
        action: `KYC_APPLICATION_${action.toUpperCase()}`,
        details: {
          applicationNumber: application.application_number,
          notes: notes || '',
          reviewedBy: adminId
        }
      });

      return application;
    } catch (error) {
      console.error('Review application error:', error);
      throw error;
    }
  }

  static async getAuditLogs(page = 1, limit = 50, applicationId?: string) {
    try {
      let query = supabase
        .from('kyc_audit_logs')
        .select(`
          *,
          users (email, first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (applicationId) {
        query = query.eq('application_id', applicationId);
      }

      const { data: logs, error } = await query;
      if (error) throw error;

      return logs;
    } catch (error) {
      console.error('Get audit logs error:', error);
      throw error;
    }
  }

  static async isAdmin(userId: string): Promise<boolean> {
    try {
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('id, role, is_active')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      return !error && !!adminUser;
    } catch (error) {
      return false;
    }
  }
}