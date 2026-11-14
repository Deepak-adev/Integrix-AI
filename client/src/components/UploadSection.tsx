import React, { useState, useRef, ChangeEvent } from 'react';
import { Upload, FileUp, X, Sparkles, Image as ImageIcon, FileText, Calendar, Tag, Radio } from 'lucide-react';

interface UploadSectionProps {
  onAudit: (formData: FormData) => void;
  isLoading: boolean;
  prefillMetadata?: {
    sku?: string;
    channel?: string;
    date?: string;
    campaignId?: string;
    submissionId?: string;
  };
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onAudit,
  isLoading,
  prefillMetadata,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [organisation] = useState<string>('NOVAWEAR');
  const [channel, setChannel] = useState<string>(prefillMetadata?.channel || 'NOVAWEAR website');
  const [pubDate, setPubDate] = useState<string>(prefillMetadata?.date || '2026-11-13');
  const [sku, setSku] = useState<string>(prefillMetadata?.sku || '');
  const [campaignId, setCampaignId] = useState<string>(prefillMetadata?.campaignId || '');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync when prefillMetadata updates
  React.useEffect(() => {
    if (prefillMetadata) {
      if (prefillMetadata.sku !== undefined) setSku(prefillMetadata.sku);
      if (prefillMetadata.channel !== undefined) setChannel(prefillMetadata.channel);
      if (prefillMetadata.date !== undefined) setPubDate(prefillMetadata.date);
      if (prefillMetadata.campaignId !== undefined) setCampaignId(prefillMetadata.campaignId);
    }
  }, [prefillMetadata]);

  const handleFile = (selectedFile: File) => {
    setFile(selectedFile);
    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const fd = new FormData();
    fd.append('file', file);
    fd.append('organisation', organisation);
    if (channel) fd.append('publicationChannel', channel);
    if (pubDate) fd.append('publicationDate', pubDate);
    if (sku) fd.append('sku', sku);
    if (campaignId) fd.append('campaignId', campaignId);
    if (prefillMetadata?.submissionId) fd.append('submissionId', prefillMetadata.submissionId);

    onAudit(fd);
  };

  const clearFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 mb-6">
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-brand-navy flex items-center gap-2">
            <Upload className="w-5 h-5 text-sky-600" />
            <span>Advertisement Upload & Context</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload marketing artwork (PNG, JPG, PDF, DOCX) to run automated content extraction and brand compliance audit.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded bg-sky-50 text-sky-700 border border-sky-200">
          Org: NOVAWEAR
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* File Upload Zone */}
          <div className="lg:col-span-7">
            <input
              type="file"
              ref={fileInputRef}
              onChange={onFileChange}
              accept=".png,.jpg,.jpeg,.webp,.pdf,.docx"
              className="hidden"
            />

            {!file ? (
              <div
                onDragOver={e => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[220px] ${
                  isDragOver
                    ? 'border-sky-500 bg-sky-50/50'
                    : 'border-slate-300 hover:border-sky-400 hover:bg-slate-50/60'
                }`}
              >
                <div className="p-3 bg-sky-100/60 rounded-full text-sky-600 mb-3 shadow-inner">
                  <FileUp className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-slate-800">
                  Drop your advertisement here, or <span className="text-sky-600 hover:underline">browse</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Supports PNG, JPG, JPEG, PDF, and DOCX files (up to 20 MB)
                </p>
                <div className="flex gap-2 mt-4 text-[11px] text-slate-500 font-medium">
                  <span className="px-2 py-0.5 rounded bg-slate-100">OCR enabled</span>
                  <span className="px-2 py-0.5 rounded bg-slate-100">PDF text parser</span>
                  <span className="px-2 py-0.5 rounded bg-slate-100">DOCX extractor</span>
                </div>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 relative">
                <button
                  type="button"
                  onClick={clearFile}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-white hover:bg-slate-200 text-slate-500 shadow-sm border border-slate-200 transition-colors"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-start gap-4">
                  {previewUrl ? (
                    <div className="w-32 h-32 rounded-lg overflow-hidden border border-slate-200 bg-white flex-shrink-0 shadow-sm">
                      <img src={previewUrl} alt="Ad preview" className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 flex flex-col items-center justify-center flex-shrink-0 shadow-sm">
                      {file.name.endsWith('.pdf') ? (
                        <FileText className="w-8 h-8 text-rose-500" />
                      ) : (
                        <FileText className="w-8 h-8 text-sky-600" />
                      )}
                      <span className="text-[10px] font-bold uppercase mt-1">
                        {file.name.split('.').pop()}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 pr-6">
                    <div className="text-sm font-bold text-slate-800 break-all">{file.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB • {file.type || 'Document'}
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-medium text-sky-600 hover:text-sky-700 underline"
                      >
                        Change file
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Metadata Parameters */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span>Product SKU</span>
                </label>
                <select
                  value={sku}
                  onChange={e => setSku(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-colors"
                >
                  <option value="">Auto-detect from creative</option>
                  <option value="NW-CS-001">NW-CS-001 (Classic Cotton Shirt)</option>
                  <option value="NW-CS-002">NW-CS-002 (Everyday Oxford Shirt)</option>
                  <option value="NW-TS-003">NW-TS-003 (Core Crew T-Shirt)</option>
                  <option value="NW-TS-004">NW-TS-004 (Relaxed Weekend Tee)</option>
                  <option value="NW-TR-005">NW-TR-005 (Everyday Chino)</option>
                  <option value="NW-OS-006">NW-OS-006 (Lightweight Overshirt)</option>
                  <option value="NW-CS-007">NW-CS-007 (Textured Office Shirt)</option>
                  <option value="NW-TS-008">NW-TS-008 (Graphic Line T-Shirt)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-slate-400" />
                  <span>Publication Channel</span>
                </label>
                <select
                  value={channel}
                  onChange={e => setChannel(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-colors"
                >
                  <option value="NOVAWEAR website">NOVAWEAR website</option>
                  <option value="NOVAWEAR website product tile">NOVAWEAR website product tile</option>
                  <option value="NOVAWEAR website banner">NOVAWEAR website banner</option>
                  <option value="Instagram feed advertisement">Instagram feed advertisement</option>
                  <option value="Instagram Shop">Instagram Shop</option>
                  <option value="Paid social advertisement">Paid social advertisement</option>
                  <option value="Third-party marketplace">Third-party marketplace</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Intended Publication Date</span>
                </label>
                <input
                  type="date"
                  value={pubDate}
                  onChange={e => setPubDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span>Campaign ID (Optional)</span>
                </label>
                <select
                  value={campaignId}
                  onChange={e => setCampaignId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-colors"
                >
                  <option value="">None / Auto-detect</option>
                  <option value="CMP-26-014">CMP-26-014 (Expired - Oct Wardrobe)</option>
                  <option value="CMP-26-018">CMP-26-018 (Approved - Weekend Essentials)</option>
                  <option value="CMP-26-021">CMP-26-021 (Pending - Chino Refresh)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={!file || isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-brand-navy hover:bg-slate-800 text-white font-semibold text-xs tracking-wide transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>{isLoading ? 'Extracting & Auditing Content...' : 'Run Content & Policy Audit'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

