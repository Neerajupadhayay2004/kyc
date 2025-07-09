import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Shield, FileCheck, Users, Lock, CheckCircle, Star, Globe, Zap } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/LocalAuthContext';
import Header from './components/layout/Header';
import LocalAdminDashboard from './components/admin/LocalAdminDashboard';
import ProgressTracker from './components/ProgressTracker';
import PersonalInfoForm from './components/PersonalInfoForm';
import DocumentUpload from './components/DocumentUpload';
import FacialVerificationComponent from './components/FacialVerification';
import ReviewSubmit from './components/ReviewSubmit';
import StatusResults from './components/StatusResults';
import { KYCData, KYCStep, PersonalInfo, DocumentInfo, FacialVerification } from './types/kyc';
import { localKYCService } from './services/localKYC';
import { KYCApplication } from './lib/localDatabase';

const KYCFlow: React.FC = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [currentApplication, setCurrentApplication] = useState<KYCApplication | null>(null);
  
  const [kycData, setKycData] = useState<KYCData>({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      nationality: '',
      address: '',
      city: '',
      country: '',
      postalCode: ''
    },
    documentInfo: {
      type: 'passport',
      number: '',
      expiryDate: '',
      issueDate: '',
      issuingAuthority: '',
      frontImage: undefined,
      backImage: undefined
    },
    facialVerification: {
      isCompleted: false,
      confidence: 0,
      matchScore: 0,
      livenessCheck: false
    },
    status: 'pending',
    riskScore: 0.3
  });

  const steps: KYCStep[] = [
    {
      id: 1,
      title: 'Personal Info',
      description: 'Basic details',
      isCompleted: currentStep > 0,
      isCurrent: currentStep === 0
    },
    {
      id: 2,
      title: 'Documents',
      description: 'Upload ID',
      isCompleted: currentStep > 1,
      isCurrent: currentStep === 1
    },
    {
      id: 3,
      title: 'Face Verify',
      description: 'Facial scan',
      isCompleted: currentStep > 2,
      isCurrent: currentStep === 2
    },
    {
      id: 4,
      title: 'Review',
      description: 'Final check',
      isCompleted: currentStep > 3,
      isCurrent: currentStep === 3
    },
    {
      id: 5,
      title: 'Complete',
      description: 'Results',
      isCompleted: currentStep > 4,
      isCurrent: currentStep === 4
    }
  ];

  const handlePersonalInfoChange = (info: PersonalInfo) => {
    setKycData(prev => ({ ...prev, personalInfo: info }));
  };

  const handleDocumentChange = (doc: DocumentInfo) => {
    setKycData(prev => ({ ...prev, documentInfo: doc }));
  };

  const handleFacialVerificationChange = (verification: FacialVerification) => {
    setKycData(prev => ({ ...prev, facialVerification: verification }));
  };

  const handleSubmit = async () => {
    if (!user || !currentApplication) return;
    
    try {
      await localKYCService.submitApplication(currentApplication.id);
      setKycData(prev => ({ 
        ...prev, 
        status: 'completed', 
        completedAt: new Date() 
      }));
      setCurrentStep(4);
    } catch (error) {
      console.error('Submit application error:', error);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setIsStarted(false);
    setCurrentApplication(null);
    setKycData({
      personalInfo: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        nationality: '',
        address: '',
        city: '',
        country: '',
        postalCode: ''
      },
      documentInfo: {
        type: 'passport',
        number: '',
        expiryDate: '',
        issueDate: '',
        issuingAuthority: '',
        frontImage: undefined,
        backImage: undefined
      },
      facialVerification: {
        isCompleted: false,
        confidence: 0,
        matchScore: 0,
        livenessCheck: false
      },
      status: 'pending',
      riskScore: 0.3
    });
  };

  const startKYCProcess = async () => {
    if (!user) return;
    
    try {
      const application = await localKYCService.createApplication(user.id, kycData.personalInfo);
      setCurrentApplication(application);
      setIsStarted(true);
    } catch (error) {
      console.error('Start KYC process error:', error);
    }
  };

  if (!user) {
    return <LandingPage />;
  }

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Secure KYC Verification System
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Complete your identity verification with our advanced KYC system. 
                Secure, fast, and compliant with global regulations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <FileCheck className="w-8 h-8 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Document Verification</h3>
                <p className="text-gray-600">Upload and verify your government-issued ID documents</p>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-6">
                <Users className="w-8 h-8 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Facial Recognition</h3>
                <p className="text-gray-600">Advanced facial verification with liveness detection</p>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-6">
                <Lock className="w-8 h-8 text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure & Private</h3>
                <p className="text-gray-600">End-to-end encryption and GDPR compliant</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Verification Process</h2>
              <div className="flex items-center justify-center space-x-4 mb-6">
                {steps.slice(0, 4).map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {step.id}
                    </div>
                    <div className="ml-2 text-sm text-gray-600">{step.title}</div>
                    {index < 3 && <div className="w-8 h-0.5 bg-gray-300 mx-4"></div>}
                  </div>
                ))}
              </div>
              <p className="text-gray-600 mb-6">
                Complete all steps to verify your identity. The process takes approximately 5-10 minutes.
              </p>
              <button
                onClick={startKYCProcess}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
              >
                Start KYC Verification
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-700">
                <strong>Important:</strong> Ensure you have a government-issued ID and access to a camera for facial verification.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">KYC Verification</h1>
            <p className="text-gray-600">Step {currentStep + 1} of {steps.length}</p>
          </div>

          <ProgressTracker steps={steps} currentStep={currentStep} />

          <div className="mt-8">
            {currentStep === 0 && (
              <PersonalInfoForm
                data={kycData.personalInfo}
                onChange={handlePersonalInfoChange}
                onNext={() => setCurrentStep(1)}
              />
            )}
            {currentStep === 1 && (
              <DocumentUpload
                data={kycData.documentInfo}
                onChange={handleDocumentChange}
                onNext={() => setCurrentStep(2)}
                onPrev={() => setCurrentStep(0)}
              />
            )}
            {currentStep === 2 && (
              <FacialVerificationComponent
                data={kycData.facialVerification}
                onChange={handleFacialVerificationChange}
                onNext={() => setCurrentStep(3)}
                onPrev={() => setCurrentStep(1)}
              />
            )}
            {currentStep === 3 && (
              <ReviewSubmit
                data={kycData}
                onSubmit={handleSubmit}
                onPrev={() => setCurrentStep(2)}
              />
            )}
            {currentStep === 4 && (
              <StatusResults
                data={kycData}
                onRestart={handleRestart}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-8">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Secure KYC
              <span className="text-blue-600"> Verification</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Complete your identity verification with our advanced KYC system. 
              Secure, fast, and compliant with global regulations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg">
                Start Verification
              </button>
              <button className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg hover:bg-gray-50 transition-colors font-medium text-lg">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose SecureKYC?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our platform combines cutting-edge technology with regulatory compliance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileCheck className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Document Verification</h3>
              <p className="text-gray-600">Advanced OCR and AI-powered document authentication</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Facial Recognition</h3>
              <p className="text-gray-600">Biometric verification with liveness detection</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Bank-Grade Security</h3>
              <p className="text-gray-600">End-to-end encryption and secure data storage</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Fast Processing</h3>
              <p className="text-gray-600">Complete verification in under 5 minutes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div id="security" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Enterprise-Grade Security
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Your data security is our top priority. We use the latest encryption 
                technologies and follow industry best practices.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                  <span className="text-gray-700">256-bit SSL encryption</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                  <span className="text-gray-700">GDPR & CCPA compliant</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                  <span className="text-gray-700">SOC 2 Type II certified</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                  <span className="text-gray-700">Regular security audits</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center">
                <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Trusted by 10,000+ Users</h3>
                <div className="flex justify-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600">
                  "SecureKYC made our compliance process seamless and secure."
                </p>
                <p className="text-sm text-gray-500 mt-2">- Financial Services Company</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Section */}
      <div id="compliance" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Global Compliance
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Meet regulatory requirements across different jurisdictions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <Globe className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">AML/KYC</h3>
              <p className="text-gray-600">Anti-Money Laundering and Know Your Customer compliance</p>
            </div>

            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <Shield className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">GDPR</h3>
              <p className="text-gray-600">European data protection regulation compliance</p>
            </div>

            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <Lock className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">PCI DSS</h3>
              <p className="text-gray-600">Payment card industry data security standards</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who trust SecureKYC for their identity verification needs
          </p>
          <button className="bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-medium text-lg">
            Start Your Verification
          </button>
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Routes>
          <Route path="/" element={<KYCFlow />} />
          <Route 
            path="/admin" 
            element={isAdmin ? <LocalAdminDashboard /> : <Navigate to="/" />} 
          />
        </Routes>
      </div>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
export default App;