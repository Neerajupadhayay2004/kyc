import { localDB, KYCApplication } from '../lib/localDatabase';

export interface KYCApplicationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationality: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
}

export interface DocumentData {
  type: 'passport' | 'driverLicense' | 'nationalId';
  number: string;
  issueDate: string;
  expiryDate: string;
  issuingAuthority: string;
  frontImage?: File;
  backImage?: File;
}

export interface FacialVerificationData {
  isCompleted: boolean;
  confidenceScore: number;
  matchScore: number;
  livenessCheck: boolean;
  facialImage?: File;
}

class LocalKYCService {
  async createApplication(userId: string, data: KYCApplicationData): Promise<KYCApplication> {
    const application = await localDB.createApplication({
      userId,
      status: 'draft',
      currentStep: 1,
      personalInfo: data,
      riskScore: 0.3,
      riskLevel: 'low',
    });

    await localDB.createAuditLog({
      userId,
      applicationId: application.id,
      action: 'KYC_APPLICATION_CREATED',
      details: { applicationNumber: application.applicationNumber }
    });

    return application;
  }

  async updateApplication(applicationId: string, data: Partial<KYCApplicationData>): Promise<KYCApplication> {
    const application = await localDB.updateApplication(applicationId, {
      personalInfo: data as any,
    });

    await localDB.createAuditLog({
      userId: application.userId,
      applicationId,
      action: 'KYC_APPLICATION_UPDATED',
      details: { step: 'personal_info' }
    });

    return application;
  }

  async uploadDocument(applicationId: string, documentData: DocumentData): Promise<KYCApplication> {
    let frontImageData = '';
    let backImageData = '';

    if (documentData.frontImage) {
      frontImageData = await localDB.storeFile(documentData.frontImage);
    }

    if (documentData.backImage) {
      backImageData = await localDB.storeFile(documentData.backImage);
    }

    const application = await localDB.updateApplication(applicationId, {
      currentStep: 2,
      documentInfo: {
        type: documentData.type,
        number: documentData.number,
        issueDate: documentData.issueDate,
        expiryDate: documentData.expiryDate,
        issuingAuthority: documentData.issuingAuthority,
        frontImage: frontImageData,
        backImage: backImageData,
      }
    });

    await localDB.createAuditLog({
      applicationId,
      action: 'KYC_DOCUMENT_UPLOADED',
      details: { 
        documentType: documentData.type,
        documentNumber: documentData.number,
        hasBackImage: !!documentData.backImage
      }
    });

    return application;
  }

  async saveFacialVerification(applicationId: string, facialData: FacialVerificationData): Promise<KYCApplication> {
    const application = await localDB.updateApplication(applicationId, {
      currentStep: 3,
      facialVerification: {
        isCompleted: facialData.isCompleted,
        confidence: facialData.confidenceScore,
        matchScore: facialData.matchScore,
        livenessCheck: facialData.livenessCheck,
      }
    });

    await localDB.createAuditLog({
      applicationId,
      action: 'KYC_FACIAL_VERIFICATION_COMPLETED',
      details: {
        confidenceScore: facialData.confidenceScore,
        matchScore: facialData.matchScore,
        livenessCheck: facialData.livenessCheck
      }
    });

    return application;
  }

  async submitApplication(applicationId: string): Promise<KYCApplication> {
    const riskScore = await this.calculateRiskScore(applicationId);
    const riskLevel = riskScore <= 0.3 ? 'low' : riskScore <= 0.7 ? 'medium' : 'high';

    const application = await localDB.updateApplication(applicationId, {
      status: 'submitted',
      currentStep: 4,
      submittedAt: new Date().toISOString(),
      riskScore,
      riskLevel,
    });

    await localDB.createAuditLog({
      userId: application.userId,
      applicationId,
      action: 'KYC_APPLICATION_SUBMITTED',
      details: {
        applicationNumber: application.applicationNumber,
        riskScore,
        riskLevel
      }
    });

    return application;
  }

  async getApplication(applicationId: string): Promise<KYCApplication | null> {
    return await localDB.getApplicationById(applicationId);
  }

  async getUserApplications(userId: string): Promise<KYCApplication[]> {
    return await localDB.getUserApplications(userId);
  }

  async getAllApplications(): Promise<KYCApplication[]> {
    return await localDB.getAllApplications();
  }

  async getApplicationsByStatus(status: string): Promise<KYCApplication[]> {
    return await localDB.getApplicationsByStatus(status);
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

  private async calculateRiskScore(applicationId: string): Promise<number> {
    const application = await localDB.getApplicationById(applicationId);
    if (!application) return 0.5;

    let riskScore = 0;
    let factors = 0;

    // Document verification factors
    if (application.documentInfo) {
      const expiryDate = new Date(application.documentInfo.expiryDate);
      const now = new Date();
      const daysUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysUntilExpiry < 30) riskScore += 0.3;
      else if (daysUntilExpiry < 90) riskScore += 0.1;
      
      factors++;
    }

    // Facial verification factors
    if (application.facialVerification) {
      const facial = application.facialVerification;
      
      if (facial.confidence < 0.8) riskScore += 0.2;
      if (facial.matchScore < 0.8) riskScore += 0.2;
      if (!facial.livenessCheck) riskScore += 0.3;
      
      factors++;
    }

    // Age factor
    const birthDate = new Date(application.personalInfo.dateOfBirth);
    const age = (Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    if (age < 18 || age > 80) riskScore += 0.2;
    factors++;

    return Math.min(riskScore / Math.max(factors, 1), 1);
  }
}

export const localKYCService = new LocalKYCService();