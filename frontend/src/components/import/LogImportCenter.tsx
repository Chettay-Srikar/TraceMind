import React, { useState, useRef } from 'react';
import { UploadCloud, FileType, AlertCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';

interface LogImportCenterProps {
  onSuccess: () => void;
}

export const LogImportCenter: React.FC<LogImportCenterProps> = ({ onSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ imported_count: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    setSuccess(null);
    const validTypes = ['text/csv', 'application/json', 'application/jsonl', 'application/x-ndjson'];
    const validExtensions = ['.csv', '.json', '.jsonl'];
    
    const isValidExtension = validExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext));
    
    if (!validTypes.includes(selectedFile.type) && !isValidExtension) {
      setError('Please upload a valid CSV, JSON, or JSONL file.');
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.uploadTelemetry(file);
      setSuccess(result);
    } catch (err: unknown) {
      setError((err as Error).message || 'An error occurred during upload.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-full max-w-2xl text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-white mb-3">Start an investigation</h2>
        <p className="text-slate-400 text-lg">Upload your application telemetry to begin.</p>
      </div>
      
      <div 
        className={`w-full max-w-2xl border-2 border-dashed rounded-2xl p-12 transition-colors flex flex-col items-center justify-center relative ${
          dragActive 
            ? 'border-green-500 bg-green-500/5' 
            : 'border-slate-700 bg-[#0B1120] hover:border-slate-500 hover:bg-[#0B1120]/80'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          ref={inputRef} 
          onChange={handleChange} 
          accept=".csv,.json,.jsonl"
          className="hidden" 
        />
        
        {loading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-green-500 animate-spin mb-4" />
            <p className="text-slate-300 font-medium">Processing telemetry...</p>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-white font-medium text-lg mb-1">Upload Successful</p>
            <p className="text-green-400 mb-6">{success.imported_count} records imported.</p>
            <button 
              onClick={onSuccess}
              className="btn btn-primary px-8 py-3"
            >
              Analyze telemetry <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <UploadCloud className="w-8 h-8 text-slate-400" />
            </div>
            
            {file ? (
              <div className="flex flex-col items-center mb-6">
                <div className="flex items-center gap-2 text-white font-medium bg-slate-800 px-4 py-2 rounded-lg mb-2">
                  <FileType className="w-4 h-4 text-green-500" />
                  {file.name}
                </div>
                <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <>
                <p className="text-white font-medium text-lg mb-2">Drop CSV or JSON files here</p>
                <p className="text-slate-500 mb-6 text-sm">Supported formats: .csv, .json, .jsonl</p>
                <button 
                  onClick={() => inputRef.current?.click()}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Choose files
                </button>
              </>
            )}
            
            {error && (
              <div className="mt-6 flex items-start gap-2 text-red-400 bg-red-500/10 px-4 py-3 rounded-lg border border-red-500/20 max-w-lg text-left">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            
            {file && !error && (
              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => setFile(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpload}
                  className="bg-green-500 hover:bg-green-600 text-[#020617] px-6 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                >
                  Upload & Validate <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {!file && !success && (
        <div className="mt-8">
          <button 
            disabled
            className="opacity-50 cursor-not-allowed bg-slate-800 text-slate-500 px-8 py-3 rounded-lg text-sm font-bold flex items-center gap-2"
          >
            Analyze telemetry <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
