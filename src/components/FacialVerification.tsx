import React, { useState, useRef, useEffect } from 'react';
import { Camera, Eye, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { FacialVerification } from '../types/kyc';

interface FacialVerificationProps {
  data: FacialVerification;
  onChange: (data: FacialVerification) => void;
  onNext: () => void;
  onPrev: () => void;
}

const FacialVerificationComponent: React.FC<FacialVerificationProps> = ({ data, onChange, onNext, onPrev }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [verificationStep, setVerificationStep] = useState<'ready' | 'capturing' | 'processing' | 'completed'>('ready');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCapturing(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please ensure you have granted camera permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/png');
        setCapturedImage(imageData);
        setVerificationStep('processing');
        
        // Simulate facial verification processing
        setTimeout(() => {
          const mockVerification: FacialVerification = {
            isCompleted: true,
            confidence: 0.95,
            matchScore: 0.89,
            livenessCheck: true
          };
          
          onChange(mockVerification);
          setVerificationStep('completed');
        }, 3000);
      }
    }
  };

  const resetVerification = () => {
    setVerificationStep('ready');
    setCapturedImage(null);
    onChange({
      isCompleted: false,
      confidence: 0,
      matchScore: 0,
      livenessCheck: false
    });
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Facial Verification</h2>
        <p className="text-gray-600">Please complete the facial verification to confirm your identity</p>
      </div>

      <div className="space-y-6">
        {verificationStep === 'ready' && (
          <div className="text-center">
            <div className="w-48 h-48 sm:w-64 sm:h-64 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Camera className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready for Facial Verification</h3>
            <p className="text-gray-600 mb-6">Position your face in the camera frame and capture a clear image</p>
            <button
              onClick={startCamera}
              className="w-full sm:w-auto bg-blue-600 text-white px-6 sm:px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Start Camera
            </button>
          </div>
        )}

        {verificationStep === 'capturing' && isCapturing && (
          <div className="text-center">
            <div className="relative inline-block">
              <video
                ref={videoRef}
                autoPlay
                className="w-64 h-64 sm:w-80 sm:h-80 rounded-lg object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              <div className="absolute inset-0 border-4 border-blue-500 rounded-lg animate-pulse"></div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <p className="text-gray-600 mt-4 mb-6">Position your face in the center of the frame</p>
            <div className="flex flex-col sm:flex-row gap-4 sm:space-x-4 justify-center">
              <button
                onClick={captureImage}
                className="w-full sm:w-auto bg-green-600 text-white px-6 sm:px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Capture Image
              </button>
              <button
                onClick={stopCamera}
                className="w-full sm:w-auto bg-gray-300 text-gray-700 px-6 sm:px-8 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {verificationStep === 'processing' && (
          <div className="text-center">
            <div className="w-48 h-48 sm:w-64 sm:h-64 bg-gray-100 rounded-lg mx-auto mb-6 flex items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Verification</h3>
            <p className="text-gray-600">Analyzing facial features and performing liveness check...</p>
          </div>
        )}

        {verificationStep === 'completed' && data.isCompleted && (
          <div className="text-center">
            <div className="w-48 h-48 sm:w-64 sm:h-64 bg-green-50 rounded-lg mx-auto mb-6 flex items-center justify-center">
              <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-green-900 mb-2">Verification Successful</h3>
            <p className="text-gray-600 mb-6">Your identity has been successfully verified</p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-gray-900">Confidence</div>
                  <div className="text-blue-600">{Math.round(data.confidence * 100)}%</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">Match Score</div>
                  <div className="text-green-600">{Math.round(data.matchScore * 100)}%</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">Liveness</div>
                  <div className="text-green-600">
                    {data.livenessCheck ? 'Passed' : 'Failed'}
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={resetVerification}
              className="w-full sm:w-auto bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium"
            >
              <RotateCcw className="w-4 h-4 inline mr-1" />
              Retry
            </button>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start">
            <Eye className="w-5 h-5 text-amber-600 mr-3 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-amber-900">Verification Tips</h4>
              <ul className="text-sm text-amber-700 mt-1 space-y-1">
                <li>• Ensure your face is well-lit and clearly visible</li>
                <li>• Look directly at the camera</li>
                <li>• Remove any accessories that might obstruct your face</li>
                <li>• Stay still during the capture process</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
          <button
            onClick={onPrev}
            className="w-full sm:w-auto bg-gray-300 text-gray-700 px-6 sm:px-8 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium"
          >
            Previous
          </button>
          <button
            onClick={onNext}
            disabled={!data.isCompleted}
            className={`w-full sm:w-auto px-6 sm:px-8 py-3 rounded-lg font-medium transition-colors ${
              data.isCompleted
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Complete Verification
          </button>
        </div>
      </div>
    </div>
  );
};

export default FacialVerificationComponent;