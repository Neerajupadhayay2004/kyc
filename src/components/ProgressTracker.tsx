import React from 'react';
import { Check, Lock } from 'lucide-react';
import { KYCStep } from '../types/kyc';

interface ProgressTrackerProps {
  steps: KYCStep[];
  currentStep: number;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ steps, currentStep }) => {
  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                  step.isCompleted
                    ? 'bg-green-500 text-white shadow-lg'
                    : step.isCurrent
                    ? 'bg-blue-500 text-white shadow-lg animate-pulse'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step.isCompleted ? (
                  <Check className="w-6 h-6" />
                ) : step.isCurrent ? (
                  <span className="text-sm font-bold">{step.id}</span>
                ) : (
                  <Lock className="w-5 h-5" />
                )}
              </div>
              <div className="mt-2 text-center">
                <p className={`text-sm font-medium ${
                  step.isCurrent ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-500 mt-1 max-w-24">
                  {step.description}
                </p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-16 h-1 mx-4 transition-all duration-300 ${
                  step.isCompleted ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressTracker;