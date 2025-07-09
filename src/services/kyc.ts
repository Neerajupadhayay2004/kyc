import { supabase } from '../lib/supabase';
import { auditLog } from './audit';
import { v4 as uuidv4 } from 'uuid';

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
  type: 'passport' | 'driver_license' | 'national_id';
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

export class KYCService {
  static async createApplication(userId: string, data: KYCApplicationData) {
    try {
      const { data: application, error } = await supabase
        .from('kyc_applications')
        .insert({
          user_id: userId,
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          date_of_birth: data.dateOfBirth,
          nationality: data.nationality,
          address: data.address,
          city: data.city,
          country: data.country,
          postal_code: data.postalCode,
          current_step: 1,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      await auditLog({
        userId,
        applicationId: application.id,
        action: 'KYC_APPLICATION_CREATED',
        details: { applicationNumber: application.application_number }
      });

      return application;
    } catch (error) {
      console.error('Create KYC application error:', error);
      throw error;
    }
  }

  static async updateApplication(applicationId: string, data: Partial<KYCApplicationData>) {
    try {
      const { data: application, error } = await supabase
        .from('kyc_applications')
        .update({
          ...data,
          first_name: data.firstName,
          last_name: data.lastName,
          date_of_birth: data.dateOfBirth,
          postal_code: data.postalCode,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)
        .select()
        .single();

      if (error) throw error;

      await auditLog({
        userId: application.user_id,
        applicationId,
        action: 'KYC_APPLICATION_UPDATED',
        details: { step: 'personal_info' }
      });

      return application;
    } catch (error) {
      console.error('Update KYC application error:', error);
      throw error;
    }
  }

  static async uploadDocument(applicationId: string, documentData: DocumentData) {
    try {
      let frontImageUrl = '';
      let backImageUrl = '';
      let frontImagePath = '';
      let backImagePath = '';

      // Upload front image
      if (documentData.frontImage) {
        const frontFileName = `${applicationId}/documents/front_${uuidv4()}.${documentData.frontImage.name.split('.').pop()}`;
        const { data: frontUpload, error: frontError } = await supabase.storage
          .from('kyc-documents')
          .upload(frontFileName, documentData.frontImage, {
            cacheControl: '3600',
            upsert: false
          });

        if (frontError) throw frontError;

        const { data: frontUrl } = supabase.storage
          .from('kyc-documents')
          .getPublicUrl(frontFileName);

        frontImageUrl = frontUrl.publicUrl;
        frontImagePath = frontFileName;
      }

      // Upload back image if provided
      if (documentData.backImage) {
        const backFileName = `${applicationId}/documents/back_${uuidv4()}.${documentData.backImage.name.split('.').pop()}`;
        const { data: backUpload, error: backError } = await supabase.storage
          .from('kyc-documents')
          .upload(backFileName, documentData.backImage, {
            cacheControl: '3600',
            upsert: false
          });

        if (backError) throw backError;

        const { data: backUrl } = supabase.storage
          .from('kyc-documents')
          .getPublicUrl(backFileName);

        backImageUrl = backUrl.publicUrl;
        backImagePath = backFileName;
      }

      // Save document data to database
      const { data: document, error } = await supabase
        .from('kyc_documents')
        .insert({
          application_id: applicationId,
          document_type: documentData.type,
          document_number: documentData.number,
          issue_date: documentData.issueDate,
          expiry_date: documentData.expiryDate,
          issuing_authority: documentData.issuingAuthority,
          front_image_url: frontImageUrl,
          back_image_url: backImageUrl,
          front_image_path: frontImagePath,
          back_image_path: backImagePath
        })
        .select()
        .single();

      if (error) throw error;

      // Update application step
      await supabase
        .from('kyc_applications')
        .update({ current_step: 2 })
        .eq('id', applicationId);

      await auditLog({
        applicationId,
        action: 'KYC_DOCUMENT_UPLOADED',
        details: { 
          documentType: documentData.type,
          documentNumber: documentData.number,
          hasBackImage: !!documentData.backImage
        }
      });

      return document;
    } catch (error) {
      console.error('Upload document error:', error);
      throw error;
    }
  }

  static async saveFacialVerification(applicationId: string, facialData: FacialVerificationData) {
    try {
      let facialImageUrl = '';
      let facialImagePath = '';

      // Upload facial image
      if (facialData.facialImage) {
        const fileName = `${applicationId}/facial/face_${uuidv4()}.${facialData.facialImage.name.split('.').pop()}`;
        const { data: upload, error: uploadError } = await supabase.storage
          .from('kyc-documents')
          .upload(fileName, facialData.facialImage, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: url } = supabase.storage
          .from('kyc-documents')
          .getPublicUrl(fileName);

        facialImageUrl = url.publicUrl;
        facialImagePath = fileName;
      }

      // Save facial verification data
      const { data: facial, error } = await supabase
        .from('kyc_facial_data')
        .insert({
          application_id: applicationId,
          is_completed: facialData.isCompleted,
          confidence_score: facialData.confidenceScore,
          match_score: facialData.matchScore,
          liveness_check: facialData.livenessCheck,
          facial_image_url: facialImageUrl,
          facial_image_path: facialImagePath,
          verification_timestamp: new Date().toISOString(),
          verification_method: 'camera'
        })
        .select()
        .single();

      if (error) throw error;

      // Update application step
      await supabase
        .from('kyc_applications')
        .update({ current_step: 3 })
        .eq('id', applicationId);

      await auditLog({
        applicationId,
        action: 'KYC_FACIAL_VERIFICATION_COMPLETED',
        details: {
          confidenceScore: facialData.confidenceScore,
          matchScore: facialData.matchScore,
          livenessCheck: facialData.livenessCheck
        }
      });

      return facial;
    } catch (error) {
      console.error('Save facial verification error:', error);
      throw error;
    }
  }

  static async submitApplication(applicationId: string) {
    try {
      // Calculate risk score based on various factors
      const riskScore = await this.calculateRiskScore(applicationId);
      const riskLevel = riskScore <= 0.3 ? 'low' : riskScore <= 0.7 ? 'medium' : 'high';

      const { data: application, error } = await supabase
        .from('kyc_applications')
        .update({
          status: 'submitted',
          current_step: 4,
          submitted_at: new Date().toISOString(),
          risk_score: riskScore,
          risk_level: riskLevel,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
        })
        .eq('id', applicationId)
        .select()
        .single();

      if (error) throw error;

      await auditLog({
        userId: application.user_id,
        applicationId,
        action: 'KYC_APPLICATION_SUBMITTED',
        details: {
          applicationNumber: application.application_number,
          riskScore,
          riskLevel
        }
      });

      return application;
    } catch (error) {
      console.error('Submit KYC application error:', error);
      throw error;
    }
  }

  static async getApplication(applicationId: string) {
    try {
      const { data: application, error } = await supabase
        .from('kyc_applications')
        .select(`
          *,
          kyc_documents (*),
          kyc_facial_data (*)
        `)
        .eq('id', applicationId)
        .single();

      if (error) throw error;
      return application;
    } catch (error) {
      console.error('Get KYC application error:', error);
      throw error;
    }
  }

  static async getUserApplications(userId: string) {
    try {
      const { data: applications, error } = await supabase
        .from('kyc_applications')
        .select(`
          *,
          kyc_documents (*),
          kyc_facial_data (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return applications;
    } catch (error) {
      console.error('Get user applications error:', error);
      throw error;
    }
  }

  private static async calculateRiskScore(applicationId: string): Promise<number> {
    try {
      // Get application data
      const { data: application } = await supabase
        .from('kyc_applications')
        .select(`
          *,
          kyc_documents (*),
          kyc_facial_data (*)
        `)
        .eq('id', applicationId)
        .single();

      if (!application) return 0.5;

      let riskScore = 0;
      let factors = 0;

      // Document verification factors
      if (application.kyc_documents?.[0]) {
        const doc = application.kyc_documents[0];
        const expiryDate = new Date(doc.expiry_date);
        const now = new Date();
        const daysUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysUntilExpiry < 30) riskScore += 0.3;
        else if (daysUntilExpiry < 90) riskScore += 0.1;
        
        factors++;
      }

      // Facial verification factors
      if (application.kyc_facial_data?.[0]) {
        const facial = application.kyc_facial_data[0];
        
        if (facial.confidence_score < 0.8) riskScore += 0.2;
        if (facial.match_score < 0.8) riskScore += 0.2;
        if (!facial.liveness_check) riskScore += 0.3;
        
        factors++;
      }

      // Age factor
      const birthDate = new Date(application.date_of_birth);
      const age = (Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (age < 18 || age > 80) riskScore += 0.2;
      factors++;

      return Math.min(riskScore / Math.max(factors, 1), 1);
    } catch (error) {
      console.error('Calculate risk score error:', error);
      return 0.5; // Default medium risk
    }
  }
}