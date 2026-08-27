'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, File, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './ui/Button';

interface UploadAreaProps {
  onUploadSuccess: (offerId: string) => void;
}

function ModeTabs({ mode, onModeChange }: { mode: 'file' | 'text'; onModeChange: (mode: 'file' | 'text') => void }) {
  return (
    <div className="flex gap-2 mb-4">
      <button
        type="button"
        onClick={() => onModeChange('file')}
        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
          mode === 'file' ? 'bg-primary text-white' : 'bg-surface border border-border text-text-secondary hover:bg-background'
        }`}
      >
        Upload File
      </button>
      <button
        type="button"
        onClick={() => onModeChange('text')}
        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
          mode === 'text' ? 'bg-primary text-white' : 'bg-surface border border-border text-text-secondary hover:bg-background'
        }`}
      >
        Paste Text
      </button>
    </div>
  );
}

export function UploadArea({ onUploadSuccess }: UploadAreaProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<'file' | 'text'>('file');
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<'IDLE' | 'SELECTED' | 'UPLOADING' | 'PROCESSING' | 'ANALYZING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MIN_TEXT_LENGTH = 50;

  // Only PDF and DOCX are supported: the backend's text extraction pipeline
  // (documentService.ts) has no OCR path for images yet.
  const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const MAX_SIZE = 15 * 1024 * 1024; // 15MB

  // Simulate progress text
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (uploadState === 'UPLOADING') {
      const states: ('UPLOADING' | 'PROCESSING' | 'ANALYZING')[] = ['UPLOADING', 'PROCESSING', 'ANALYZING'];
      let i = 0;
      interval = setInterval(() => {
        i++;
        if (i < states.length) {
          setUploadState(states[i]);
        }
      }, 4000); // cycle through states every 4 seconds
    }
    return () => clearInterval(interval);
  }, [uploadState]);

  const handleFile = (selectedFile: File) => {
    setError(null);
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a PDF or DOCX file.');
      return;
    }
    if (selectedFile.size > MAX_SIZE) {
      setError('File must be smaller than 15MB.');
      return;
    }
    setFile(selectedFile);
    setUploadState('SELECTED');
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const submitAnalysis = async (request: () => Promise<Response>, genericErrorMessage: string) => {
    setUploadState('UPLOADING');
    setError(null);

    try {
      const res = await request();

      if (!res.ok) {
        let message = genericErrorMessage;
        try {
          const errBody = await res.json();
          if (errBody?.error) message = errBody.error;
        } catch {
          // keep generic fallback if the response wasn't JSON
        }
        throw new Error(message);
      }

      const responseData = await res.json();
      setUploadState('SUCCESS');
      const offerId = responseData.data.offer_id;
      onUploadSuccess(offerId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : genericErrorMessage;
      setError(msg);
      setUploadState('ERROR');
      console.error(err);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    if (!user) {
      setError('Please sign in to analyze your offer.');
      setUploadState('ERROR');
      return;
    }
    const token = await user.getIdToken();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const formData = new FormData();
    formData.append('document', file);

    await submitAnalysis(
      () => fetch(`${apiUrl}/api/offers/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      }),
      'We couldn\'t complete the analysis. Your document was not changed.'
    );
  };

  const handleTextAnalyze = async () => {
    if (pastedText.trim().length < MIN_TEXT_LENGTH) return;
    if (!user) {
      setError('Please sign in to analyze your offer.');
      setUploadState('ERROR');
      return;
    }
    const token = await user.getIdToken();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    await submitAnalysis(
      () => fetch(`${apiUrl}/api/offers/analyze-text`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: pastedText })
      }),
      'We couldn\'t complete the analysis. Your text was not changed.'
    );
  };

  const getStatusText = () => {
    switch (uploadState) {
      case 'UPLOADING': return 'Uploading offer...';
      case 'PROCESSING': return 'Extracting terms...';
      case 'ANALYZING': return 'Analyzing your offer... Preparing your report...';
      default: return 'Uploading offer...';
    }
  };

  const isBusy = ['UPLOADING', 'PROCESSING', 'ANALYZING'].includes(uploadState);

  if (mode === 'text') {
    return (
      <div className="w-full">
        <ModeTabs mode={mode} onModeChange={(m) => { setMode(m); setError(null); }} />
        <div className="w-full bg-surface border border-border rounded-lg p-6">
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            disabled={isBusy}
            placeholder="Paste the full text of your offer letter here..."
            className="w-full h-48 p-3 rounded-md border border-border bg-background text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none disabled:opacity-50"
          />

          {error && <p className="text-error text-sm mt-3">{error}</p>}

          {isBusy ? (
            <div className="w-full flex flex-col items-center justify-center p-4 mt-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-text-primary font-medium animate-pulse">{getStatusText()}</p>
            </div>
          ) : (
            <Button
              onClick={handleTextAnalyze}
              disabled={pastedText.trim().length < MIN_TEXT_LENGTH}
              className="w-full mt-4"
            >
              {uploadState === 'ERROR' ? 'Retry Analysis' : 'Analyze Offer Letter'}
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (file) {
    return (
      <div className="w-full bg-surface border border-border rounded-lg p-6 flex flex-col items-center justify-center">
        <div className="flex items-center gap-3 bg-background p-4 rounded-md border border-border w-full max-w-md mb-6">
          <File className="text-primary h-8 w-8" />
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-text-primary truncate">{file.name}</p>
            <p className="text-xs text-text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          <button 
            onClick={() => { setFile(null); setUploadState('IDLE'); setError(null); }} 
            disabled={isBusy}
            className={`text-text-muted transition-colors ${isBusy ? 'opacity-50 cursor-not-allowed' : 'hover:text-error'}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {error && <p className="text-error text-sm mb-4">{error}</p>}
        
        {isBusy ? (
           <div className="w-full max-w-md flex flex-col items-center justify-center p-4">
             <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="text-text-primary font-medium animate-pulse">{getStatusText()}</p>
           </div>
        ) : (
          <Button onClick={handleUpload} className="w-full max-w-xs">
            {uploadState === 'ERROR' ? 'Retry Analysis' : 'Analyze Offer Letter'}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <ModeTabs mode={mode} onModeChange={(m) => { setMode(m); setError(null); }} />
      <div
        className={`w-full border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center transition-colors cursor-pointer ${
          isDragging ? 'border-primary bg-primary/5' : 'border-border bg-surface hover:bg-background'
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
          accept=".pdf,.docx"
        />

        <div className="bg-primary/10 p-4 rounded-full mb-4 text-primary">
          <UploadCloud className="h-8 w-8" />
        </div>

        <h3 className="text-lg font-medium text-text-primary mb-1">Upload your offer letter</h3>
        <p className="text-sm text-text-muted text-center mb-6">
          Drag and drop your file here, or click to browse.<br/>
          Supports PDF and DOCX up to 15MB.
        </p>

        <Button variant="outline" className="pointer-events-none">
          Browse files
        </Button>
      </div>
    </div>
  );
}
