export interface PersonalInfo {
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

export interface DocumentInfo {
  type: 'passport' | 'driverLicense' | 'nationalId';
  number: string;
  expiryDate: string;
  issueDate: string;
  issuingAuthority: string;
  frontImage?: File;
  backImage?: File;
}

export interface FacialVerification {
  isCompleted: boolean;
  confidence: number;
  matchScore: number;
  livenessCheck: boolean;
}

export interface KYCData {
  personalInfo: PersonalInfo;
  documentInfo: DocumentInfo;
  facialVerification: FacialVerification;
  status: 'pending' | 'inProgress' | 'completed' | 'rejected';
  completedAt?: Date;
  riskScore: number;
}

export interface KYCStep {
  id: number;
  title: string;
  description: string;
  isCompleted: boolean;
  isCurrent: boolean;
}