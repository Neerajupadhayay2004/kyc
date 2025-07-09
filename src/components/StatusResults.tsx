import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Download, RefreshCw, Shield } from 'lucide-react';
import { KYCData } from '../types/kyc';

interface StatusResultsProps {
  data: KYCData;
  onRestart: () => void;
}

const StatusResults: React.FC<StatusResultsProps> = ({ data, onRestart }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getStatusInfo = () => {
    switch (data.status) {
      case 'completed':
        return {
          icon: <CheckCircle className="w-16 h-16 text-green-500" />,
          title: 'KYC Verification Completed',
          message: 'Your identity has been successfully verified and approved.',
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200'
        };
      case 'rejected':
        return {
          icon: <XCircle className="w-16 h-16 text-red-500" />,
          title: 'KYC Verification Rejected',
          message: 'Your verification was rejected. Please review the details and resubmit.',
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200'
        };
      default:
        return {
          icon: <Clock className="w-16 h-16 text-blue-500" />,
          title: 'KYC Verification In Progress',
          message: 'Your application is being reviewed. This may take up to 24 hours.',
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="mb-6">{statusInfo.icon}</div>
        <h2 className={`text-xl sm:text-2xl font-bold ${statusInfo.color} mb-2`}>{statusInfo.title}</h2>
        <p className="text-gray-600">{statusInfo.message}</p>
      </div>

      <div className={`${statusInfo.bg} ${statusInfo.border} border rounded-lg p-6 mb-6`}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-sm font-medium text-gray-700">Application ID</div>
            <div className="text-lg font-semibold text-gray-900">KYC-{Date.now().toString().slice(-6)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-700">Submitted</div>
            <div className="text-lg font-semibold text-gray-900">
              {data.completedAt ? data.completedAt.toLocaleDateString() : 'Today'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-700">Status</div>
            <div className={`text-lg font-semibold capitalize ${statusInfo.color}`}>
              {data.status}
            </div>
          </div>
        </div>
      </div>

      {/* Verification Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Verification Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Personal Information</span>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex justify-between">
              <span>Document Upload</span>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex justify-between">
              <span>Facial Verification</span>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex justify-between">
              <span>Risk Assessment</span>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Security Metrics</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Confidence Level</span>
              <span className="font-medium">{Math.round(data.facialVerification.confidence * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Match Score</span>
              <span className="font-medium">{Math.round(data.facialVerification.matchScore * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Risk Score</span>
              <span className="font-medium">{Math.round(data.riskScore * 100)}/100</span>
            </div>
            <div className="flex justify-between">
              <span>Liveness Check</span>
              <span className="font-medium">{data.facialVerification.livenessCheck ? 'Passed' : 'Failed'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => window.print()}
          className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Certificate
        </button>
        
        {data.status === 'rejected' && (
          <button
            onClick={onRestart}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Restart KYC Process
          </button>
        )}
      </div>

      {/* Security Notice */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Shield className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Security Notice</h4>
            <p className="text-sm text-blue-700 mt-1">
              Your data is encrypted and stored securely. We comply with all relevant data protection regulations 
              and will only use your information for verification purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusResults;