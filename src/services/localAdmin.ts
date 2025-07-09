import { localDB, KYCApplication } from '../lib/localDatabase';

export interface AdminStats {
  totalApplications: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  todaySubmissions: number;
}

class LocalAdminService {
  async getStats(): Promise<AdminStats> {
    const applications = await localDB.getAllApplications();
    const today = new Date().toDateString();
    
    const stats: AdminStats = {
      totalApplications: applications.length,
      pendingReview: applications.filter(app => app.status === 'submitted').length,
      approved: applications.filter(app => app.status === 'approved').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
      todaySubmissions: applications.filter(app => 
        new Date(app.createdAt).toDateString() === today
      ).length
    };

    return stats;
  }

  async getAllApplications(page = 1, limit = 20, status?: string): Promise<KYCApplication[]> {
    let applications = await localDB.getAllApplications();
    
    if (status) {
      applications = applications.filter(app => app.status === status);
    }

    // Sort by creation date (newest first)
    applications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return applications.slice(start, end);
  }

  async reviewApplication(applicationId: string, action: 'approve' | 'reject', adminId: string, notes?: string): Promise<KYCApplication> {
    const status = action === 'approve' ? 'approved' : 'rejected';
    const timestamp = new Date().toISOString();

    const updateData: any = {
      status,
      reviewedBy: adminId,
      reviewedAt: timestamp,
      adminNotes: notes || null
    };

    if (action === 'approve') {
      updateData.approvedAt = timestamp;
    } else {
      updateData.rejectedAt = timestamp;
      updateData.rejectionReason = notes;
    }

    const application = await localDB.updateApplication(applicationId, updateData);

    await localDB.createAuditLog({
      userId: adminId,
      applicationId,
      action: `KYC_APPLICATION_${action.toUpperCase()}`,
      details: {
        applicationNumber: application.applicationNumber,
        notes: notes || '',
        reviewedBy: adminId
      }
    });

    return application;
  }

  async isAdmin(userId: string): Promise<boolean> {
    const user = await localDB.getUserById(userId);
    return user?.isAdmin || false;
  }
}

export const localAdminService = new LocalAdminService();