import React, { useState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { parseCSV, parseJSON, generateSampleProfiles } from '../utils/csvParser';
import { Profile } from '../types/index';

interface FileUploadProps {
  onProfilesLoaded: (profiles: Profile[]) => void;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onProfilesLoaded, isLoading }) => {
  const [error, setError] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (file: File) => {
    setError('');

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;

        let profiles: Profile[] = [];

        if (file.name.endsWith('.csv')) {
          profiles = parseCSV(text);
        } else if (file.name.endsWith('.json')) {
          profiles = parseJSON(text);
        } else {
          setError('Please upload a CSV or JSON file');
          return;
        }

        if (profiles.length === 0) {
          setError('No valid profiles found in the file');
          return;
        }

        if (profiles.length < 20) {
          setError('Need at least 20 profiles to create dinner groups');
          return;
        }

        onProfilesLoaded(profiles);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error parsing file');
      }
    };

    reader.readAsText(file);
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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const loadSampleData = () => {
    const sampleProfiles = generateSampleProfiles(50);
    onProfilesLoaded(sampleProfiles);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Dinner Party Grouping</h2>
      <p className="text-gray-600 mb-6">Upload your quiz responses to automatically create optimized dinner groups</p>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition cursor-pointer ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Upload size={32} className="mx-auto text-gray-400 mb-3" />
        <p className="text-gray-700 font-semibold mb-2">Drag and drop your file here</p>
        <p className="text-gray-600 text-sm mb-4">Supports CSV and JSON formats</p>

        <label className="inline-block">
          <input
            type="file"
            accept=".csv,.json"
            onChange={handleChange}
            disabled={isLoading}
            className="hidden"
          />
          <span
            className={`inline-block px-6 py-2 bg-blue-600 text-white rounded-lg font-medium transition ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700 cursor-pointer'
            }`}
          >
            Select File
          </span>
        </label>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="mt-6 border-t pt-6">
        <p className="text-sm text-gray-600 mb-3">Don't have data? Try with sample profiles:</p>
        <button
          onClick={loadSampleData}
          disabled={isLoading}
          className={`px-6 py-2 border border-gray-300 rounded-lg font-medium transition ${
            isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'
          }`}
        >
          Load 50 Sample Profiles
        </button>
      </div>
    </div>
  );
};
