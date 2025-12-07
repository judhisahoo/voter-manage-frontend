'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaFileImport, FaFileExcel, FaFileCsv, FaUpload, FaTimes, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import DashboardLayout from '@/app/components/DashboardLayout';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import Cookies from 'js-cookie';

export default function ImportDataPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const allowedExtensions = ['.xlsx', '.xls', '.csv'];

  // Redirect non-admin users
  useEffect(() => {
    if (isAuthenticated && user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  const validateFile = (file: File): boolean => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      setMessage(t('dataManagement.invalidFileType'));
      setUploadStatus('error');
      return false;
    }
    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      setUploadStatus('idle');
      setMessage('');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      setUploadStatus('idle');
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage(t('dataManagement.selectFileFirst'));
      setUploadStatus('error');
      return;
    }

    setUploading(true);
    setUploadStatus('idle');
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const token = Cookies.get('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/voter-data/upload-excel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('dataManagement.uploadFailed'));
      }

      const result = await response.json();
      console.log('result ::', result);
      setUploadStatus('success');
      setMessage(result.message || t('dataManagement.uploadSuccess'));
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      setUploadStatus('error');
      setMessage(error.message || t('dataManagement.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return null;
    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (extension === 'csv') {
      return <FaFileCsv className="text-green-500 text-4xl" />;
    }
    return <FaFileExcel className="text-green-600 text-4xl" />;
  };

  // Only allow admin access
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">{t('dataManagement.accessDenied')}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <div className="max-w-8xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <FaFileImport className="text-indigo-600" />
            {t('dataManagement.importData')}
          </h1>
          <p className="text-gray-600 mt-2">
            {t('dataManagement.importDescription')}
          </p>
        </div>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragActive
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-300 hover:border-indigo-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {!selectedFile ? (
            <>
              <div className="flex justify-center mb-4">
                <div className="bg-indigo-100 p-4 rounded-full">
                  <FaUpload className="text-indigo-600 text-3xl" />
                </div>
              </div>
              <p className="text-gray-700 font-medium mb-2">
                {t('dataManagement.dragDropFile')}
              </p>
              <p className="text-gray-500 text-sm mb-4">{t('dataManagement.or')}</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                {t('dataManagement.browseFiles')}
              </button>
              <p className="text-gray-400 text-sm mt-4">
                {t('dataManagement.supportedFormats')}
              </p>
            </>
          ) : (
            <div className="flex items-center justify-center gap-4">
              {getFileIcon()}
              <div className="text-left">
                <p className="font-medium text-gray-800">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <button
                onClick={clearFile}
                className="ml-4 text-red-500 hover:text-red-700 p-2"
                title={t('dataManagement.removeFile')}
              >
                <FaTimes size={20} />
              </button>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Status Message */}
        {message && (
          <div
            className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
              uploadStatus === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {uploadStatus === 'success' ? (
              <FaCheckCircle className="text-xl" />
            ) : (
              <FaExclamationCircle className="text-xl" />
            )}
            <span>{message}</span>
          </div>
        )}

        {/* Upload Button */}
        <div className="mt-6">
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className={`w-full py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
              !selectedFile || uploading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {uploading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {t('dataManagement.uploading')}
              </>
            ) : (
              <>
                <FaUpload />
                {t('dataManagement.uploadFile')}
              </>
            )}
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-3">{t('dataManagement.instructions')}</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• {t('dataManagement.instruction1')}</li>
            <li>• {t('dataManagement.instruction2')}</li>
            <li>• {t('dataManagement.instruction3')}</li>
            <li>• {t('dataManagement.instruction4')}</li>
          </ul>
        </div>
      </div>
  );
}
