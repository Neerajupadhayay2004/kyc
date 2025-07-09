import React, { useState, useRef } from 'react';
import { Upload, FileText, Camera, AlertCircle, Check } from 'lucide-react';
import { DocumentInfo } from '../types/kyc';

interface DocumentUploadProps {
  data: DocumentInfo;
  onChange: (data: DocumentInfo) => void;
  onNext: () => void;
  onPrev: () => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ data, onChange, onNext, onPrev }) => {
  const [errors, setErrors] = useState<Partial<DocumentInfo>>({});
  const [dragOver, setDragOver] = useState(false);
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const validateForm = () => {
    const newErrors: Partial<DocumentInfo> = {};
    
    if (!data.type) newErrors.type = 'Document type is required';
    if (!data.number.trim()) newErrors.number = 'Document number is required';
    if (!data.expiryDate) newErrors.expiryDate = 'Expiry date is required';
    if (!data.issueDate) newErrors.issueDate = 'Issue date is required';
    if (!data.issuingAuthority.trim()) newErrors.issuingAuthority = 'Issuing authority is required';
    if (!data.frontImage) newErrors.frontImage = 'Front image is required';
    if (data.type === 'driverLicense' && !data.backImage) {
      newErrors.backImage = 'Back image is required for driver license';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onNext();
    }
  };

  const handleChange = (field: keyof DocumentInfo, value: string) => {
    onChange({ ...data, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const handleFileUpload = (file: File, type: 'front' | 'back') => {
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const field = type === 'front' ? 'frontImage' : 'backImage';
    onChange({ ...data, [field]: file });
    
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'front' | 'back') => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file, type);
    }
  };

  const FileUploadArea = ({ type, label, required = false }: { type: 'front' | 'back'; label: string; required?: boolean }) => {
    const file = type === 'front' ? data.frontImage : data.backImage;
    const inputRef = type === 'front' ? frontInputRef : backInputRef;
    const error = type === 'front' ? errors.frontImage : errors.backImage;

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
            dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          } ${error ? 'border-red-500 bg-red-50' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => handleDrop(e, type)}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], type)}
            className="hidden"
          />
          
          {file ? (
            <div className="space-y-2">
              <Check className="w-8 h-8 text-green-500 mx-auto" />
              <p className="text-sm text-green-600">{file.name}</p>
              <p className="text-xs text-gray-500">Click to replace</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-8 h-8 text-gray-400 mx-auto" />
              <p className="text-sm text-gray-600">Drop your image here or click to browse</p>
              <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Document Upload</h2>
        <p className="text-gray-600">Please upload clear, high-quality images of your identification document</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="inline w-4 h-4 mr-1" />
            Document Type
          </label>
          <select
            value={data.type}
            onChange={(e) => handleChange('type', e.target.value)}
            className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              errors.type ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
          >
            <option value="">Select document type</option>
            <option value="passport">Passport</option>
            <option value="driverLicense">Driver's License</option>
            <option value="nationalId">National ID</option>
          </select>
          {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Document Number</label>
            <input
              type="text"
              value={data.number}
              onChange={(e) => handleChange('number', e.target.value)}
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.number ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter document number"
            />
            {errors.number && <p className="mt-1 text-sm text-red-600">{errors.number}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Issuing Authority</label>
            <input
              type="text"
              value={data.issuingAuthority}
              onChange={(e) => handleChange('issuingAuthority', e.target.value)}
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.issuingAuthority ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter issuing authority"
            />
            {errors.issuingAuthority && <p className="mt-1 text-sm text-red-600">{errors.issuingAuthority}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Issue Date</label>
            <input
              type="date"
              value={data.issueDate}
              onChange={(e) => handleChange('issueDate', e.target.value)}
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.issueDate ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.issueDate && <p className="mt-1 text-sm text-red-600">{errors.issueDate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
            <input
              type="date"
              value={data.expiryDate}
              onChange={(e) => handleChange('expiryDate', e.target.value)}
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.expiryDate ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.expiryDate && <p className="mt-1 text-sm text-red-600">{errors.expiryDate}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <FileUploadArea type="front" label="Front of Document" required />
          {data.type === 'driverLicense' && (
            <FileUploadArea type="back" label="Back of Document" required />
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">Document Requirements</h4>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• Ensure all text is clearly visible and readable</li>
                <li>• Image should be well-lit without shadows or glare</li>
                <li>• Document should be flat and fully visible in frame</li>
                <li>• File size should not exceed 5MB</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
          <button
            type="button"
            onClick={onPrev}
            className="w-full sm:w-auto bg-gray-300 text-gray-700 px-6 sm:px-8 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium"
          >
            Previous
          </button>
          <button
            type="submit"
            className="w-full sm:w-auto bg-blue-600 text-white px-6 sm:px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Continue to Facial Verification
          </button>
        </div>
      </form>
    </div>
  );
};

export default DocumentUpload;