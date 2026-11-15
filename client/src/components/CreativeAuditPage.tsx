import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  X,
  FileCheck2,
  AlertCircle,
  Sparkles,
  Info,
  Calendar,
  Radio,
  Tag,
  Hash,
  Database,
} from 'lucide-react';
import { uploadAndAudit, ApiError } from '../services/api';
import { AuditResult } from '../types';
import { AuditResultView } from './AuditResultView';

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg', '.webp'];
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export const CreativeAuditPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [publicationChannel, setPublicationChannel] = useState('NOVAWEAR website');
  const [publicationDate, setPublicationDate] = useState('2026-11-13');
  const [sku, setSku] = useState('');
  const [submissionId, setSubmissionId] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (selectedFile: File): string | null => {
    const ext = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `File type "${ext}" is not supported. Please upload PDF, DOCX, DOC, PNG, JPG, or WEBP.`;
    }
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      return `File size (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB) exceeds maximum allowed 20 MB.`;
    }
    return null;
  };

  const handleFileSelect = (selectedFile: File) => {
    setErrorMessage(null);
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setFile(selectedFile);
    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage('Please select a creative advertisement file to audit.');
      return;
    }

    setIsLoading(true);
    setStatusMessage('Uploading creative & executing deterministic audit...');
    setErrorMessage(null);
    setAuditResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('organisation', 'NOVAWEAR');
    if (publicationChannel) formData.append('publicationChannel', publicationChannel);
    if (publicationDate) formData.append('publicationDate', publicationDate);
    if (sku.trim()) formData.append('sku', sku.trim());
    if (submissionId.trim()) formData.append('submissionId', submissionId.trim());

    try {
      const result = await uploadAndAudit(formData);
      setAuditResult(result);
    } catch (err: any) {
      console.error('[CreativeAudit] Upload audit error:', err);
      if (err instanceof ApiError && err.status === 409) {
        setErrorMessage(
          'Submission Conflict (HTTP 409): A different advertisement file already exists for this Submission ID. Please provide a unique submission ID or retry with the identical file.'
        );
      } else {
        setErrorMessage(err.message || 'An error occurred during creative evaluation.');
      }
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  const handleNewAudit = () => {
    setAuditResult(null);
    removeFile();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ── Page Header ── */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Creative Audit</h2>
        <p className="text-xs text-slate-500 mt-1">
          Upload banner ads, social posts, catalogue pages, or campaign creatives for brand compliance verification.
        </p>
      </div>

      {auditResult ? (
        <AuditResultView result={auditResult} onNewAudit={handleNewAudit} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Banner */}
          {errorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-800 leading-relaxed font-medium">
                {errorMessage}
              </div>
            </div>
          )}

          {/* ── File Upload Dropzone ── */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Creative File</h3>
            <p className="text-xs text-slate-500 mb-4">
              Supported formats: PDF, DOCX, DOC, PNG, JPG, JPEG, WEBP (Max 20 MB).
            </p>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />

            {!file ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-indigo-500 bg-indigo-50/50'
                    : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 mx-auto flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-xs font-semibold text-slate-800">
                  Click to select or drag and drop your advertisement creative here
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  High-resolution PNG, JPG, WEBP or PDF documents up to 20 MB
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/60 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                  )}
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-900 truncate">{file.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB • {file.type || 'Document'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={removeFile}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* ── Metadata Configuration Form ── */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Audit Metadata</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              {/* Publication Channel */}
              <div>
                <label className="block text-slate-600 font-medium mb-1.5 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-slate-400" />
                  Publication Channel
                </label>
                <select
                  value={publicationChannel}
                  onChange={(e) => setPublicationChannel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="NOVAWEAR website">NOVAWEAR website</option>
                  <option value="Instagram Shop">Instagram Shop</option>
                  <option value="Print / Catalogue">Print / Catalogue</option>
                  <option value="Newsletter">Newsletter</option>
                  <option value="General">General / All Channels</option>
                </select>
              </div>

              {/* Publication Date */}
              <div>
                <label className="block text-slate-600 font-medium mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Publication Date
                </label>
                <input
                  type="date"
                  value={publicationDate}
                  onChange={(e) => setPublicationDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              {/* Target SKU */}
              <div>
                <label className="block text-slate-600 font-medium mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  Target SKU (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. NW-CS-001"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              {/* Submission ID for Idempotency */}
              <div>
                <label className="block text-slate-600 font-medium mb-1.5 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-slate-400" />
                  Submission ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Auto-generated if empty"
                  value={submissionId}
                  onChange={(e) => setSubmissionId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* ── Submit Action ── */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={!file || isLoading}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 ${
                !file || isLoading
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20 cursor-pointer'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{statusMessage || 'Auditing creative...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Execute Creative Audit</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
