import React, { useState } from 'react';
import { User, FileText, Camera, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { KYCData } from '../types/kyc';

interface ReviewSubmitProps {
  data: KYCData;
  onSubmit: () => void;
  onPrev: () => void;
}

const ReviewSubmit: React.FC<ReviewSubmitProps> = ({ data, onSubmit, onPrev }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async () => {
    if (!agreedToTerms) {
      alert('Please agree to the terms and conditions');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate submission process
    setTimeout(() => {
      onSubmit();
      setIsSubmitting(false);
    }, 2000);
  };

  const getRiskLevel = (score: number) => {
    if (score <= 0.3) return { level: 'Low', color: 'text-green-600', bg: 'bg-green-100' };
    if (score <= 0.7) return { level: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { level: 'High', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const riskInfo = getRiskLevel(data.riskScore);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Review & Submit</h2>
        <p className="text-gray-600">Please review your information before submitting your KYC application</p>
      </div>

      <div className="space-y-6">
        {/* Personal Information Review */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <User className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Name:</span>
              <span className="ml-2 text-gray-900">{data.personalInfo.firstName} {data.personalInfo.lastName}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Email:</span>
              <span className="ml-2 text-gray-900">{data.personalInfo.email}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Phone:</span>
              <span className="ml-2 text-gray-900">{data.personalInfo.phone}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Date of Birth:</span>
              <span className="ml-2 text-gray-900">{data.personalInfo.dateOfBirth}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Nationality:</span>
              <span className="ml-2 text-gray-900">{data.personalInfo.nationality}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="font-medium text-gray-700">Address:</span>
              <span className="ml-2 text-gray-900">{data.personalInfo.address}</span>
            </div>
          </div>
        </div>

        {/* Document Information Review */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <FileText className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Document Information</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Document Type:</span>
              <span className="ml-2 text-gray-900 capitalize">{data.documentInfo.type.replace(/([A-Z])/g, ' $1')}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Document Number:</span>
              <span className="ml-2 text-gray-900">{data.documentInfo.number}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Issue Date:</span>
              <span className="ml-2 text-gray-900">{data.documentInfo.issueDate}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Expiry Date:</span>
              <span className="ml-2 text-gray-900">{data.documentInfo.expiryDate}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Issuing Authority:</span>
              <span className="ml-2 text-gray-900">{data.documentInfo.issuingAuthority}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Images:</span>
              <span className="ml-2 text-gray-900">
                {data.documentInfo.frontImage ? 'Front uploaded' : 'No front image'}
                {data.documentInfo.backImage && ', Back uploaded'}
              </span>
            </div>
          </div>
        </div>

        {/* Facial Verification Review */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Camera className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Facial Verification</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Status:</span>
              <span className={`ml-2 ${data.facialVerification.isCompleted ? 'text-green-600' : 'text-red-600'}`}>
                {data.facialVerification.isCompleted ? 'Completed' : 'Pending'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Confidence:</span>
              <span className="ml-2 text-gray-900">{Math.round(data.facialVerification.confidence * 100)}%</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Match Score:</span>
              <span className="ml-2 text-gray-900">{Math.round(data.facialVerification.matchScore * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Shield className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Risk Assessment</h3>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="font-medium text-gray-700 mr-4">Risk Level:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${riskInfo.bg} ${riskInfo.color}`}>
              {riskInfo.level}
            </span>
            <span className="ml-4 text-sm text-gray-600">
              Score: {Math.round(data.riskScore * 100)}/100
            </span>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 mr-3"
            />
            <label htmlFor="terms" className="text-sm text-blue-900">
              <span className="font-medium">I agree to the terms and conditions</span>
              <p className="mt-1 text-blue-700">
                By submitting this KYC application, I confirm that all information provided is accurate and complete. 
                I understand that any false information may result in rejection of my application and potential legal consequences.
              </p>
            </label>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-amber-600 mr-3 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-amber-900">Important Notice</h4>
              <p className="text-sm text-amber-700 mt-1">
                Once submitted, your KYC application cannot be modified. Please ensure all information is correct before proceeding.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
          <button
            onClick={onPrev}
            disabled={isSubmitting}
            className="w-full sm:w-auto bg-gray-300 text-gray-700 px-6 sm:px-8 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={handleSubmit}
            disabled={!agreedToTerms || isSubmitting}
            className={`w-full sm:w-auto px-6 sm:px-8 py-3 rounded-lg font-medium transition-colors ${
              agreedToTerms && !isSubmitting
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </div>
            ) : (
              'Submit KYC Application'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewSubmit;