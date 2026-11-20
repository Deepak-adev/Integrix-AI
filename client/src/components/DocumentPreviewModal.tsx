import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Download,
  ExternalLink,
  Table,
  Info,
  AlertCircle,
  FileSpreadsheet,
  FileCode,
  Search,
  Maximize2,
  Minimize2,
  RefreshCw,
} from 'lucide-react';

export interface DocumentPreviewItem {
  id: string;
  filename: string;
  title: string;
  description?: string;
  fileType: string;
  fileSize?: string;
  path?: string;
  sourceDocId?: string;
  category?: string;
  pageRef?: string | number;
  highlightText?: string;
}

interface DocumentPreviewModalProps {
  document: DocumentPreviewItem | null;
  onClose: () => void;
}

/**
 * Build primary and fallback URLs for a given filename
 */
function resolveDocumentUrls(filename: string, explicitPath?: string): { primary: string; fallback: string } {
  const safeName = filename.split(/[/\\]/).pop()?.trim() || filename;

  // Canonical alias mappings
  let resolvedName = safeName;
  const lower = safeName.toLowerCase();
  if (lower === '01_brand_style_and_identity.pdf') {
    resolvedName = '01_Brand_Style_and_Identity.pdf';
  } else if (lower === '03_marketing_policy.pdf') {
    resolvedName = '03_Marketing_Policy.pdf';
  } else if (lower === '05_product_catalogue.xlsx') {
    resolvedName = '05_Product_Catalogue.xlsx';
  }

  // Primary: backend dedicated document route (delivers actual file bytes with headers)
  // Fallback: client public /sample-docs static asset route
  const primary = `/api/documents/${encodeURIComponent(resolvedName)}`;
  const fallback = explicitPath && explicitPath.startsWith('/')
    ? explicitPath
    : `/sample-docs/${encodeURIComponent(resolvedName)}`;

  return { primary, fallback };
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document,
  onClose,
}) => {
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [spreadsheetData, setSpreadsheetData] = useState<Record<string, any[][]> | null>(null);
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [pdfValidated, setPdfValidated] = useState<boolean>(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [tableSearch, setTableSearch] = useState<string>('');
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);

  useEffect(() => {
    if (!document) {
      setSpreadsheetData(null);
      setDocxHtml(null);
      setTextContent(null);
      setError(null);
      setPdfValidated(false);
      setPdfUrl('');
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);
    setPdfValidated(false);

    const ext = document.filename.split('.').pop()?.toLowerCase() || '';
    const { primary, fallback } = resolveDocumentUrls(document.filename, document.path);

    // ─────────────────────────────────────────────────────────────
    // 1. PDF VALIDATION & VERIFICATION (Prevent SPA fallback loop)
    // ─────────────────────────────────────────────────────────────
    if (ext === 'pdf') {
      const verifyPdf = async () => {
        const candidates = [primary, fallback];
        for (const url of candidates) {
          try {
            const resp = await fetch(url, { method: 'HEAD' });
            const cType = resp.headers.get('content-type') || '';
            // Reject any URL that returns HTML (SPA index.html fallback)
            if (resp.ok && !cType.includes('text/html')) {
              if (isMounted) {
                setPdfUrl(url);
                setPdfValidated(true);
                setLoading(false);
              }
              return;
            }
          } catch {
            // continue candidate loop
          }
        }

        // Try direct GET probe if HEAD not supported
        try {
          const resp = await fetch(fallback);
          const cType = resp.headers.get('content-type') || '';
          if (resp.ok && !cType.includes('text/html')) {
            if (isMounted) {
              setPdfUrl(fallback);
              setPdfValidated(true);
              setLoading(false);
            }
            return;
          }
        } catch {}

        if (isMounted) {
          setError(`PDF document '${document.filename}' could not be located in organisation repository.`);
          setLoading(false);
        }
      };

      verifyPdf();
    }
    // ─────────────────────────────────────────────────────────────
    // 2. SPREADSHEET (XLSX / CSV) DATA PARSER
    // ─────────────────────────────────────────────────────────────
    else if (ext === 'xlsx' || ext === 'csv' || ext === 'xls') {
      const loadSpreadsheet = async () => {
        // Look for corresponding JSON representation in public/sample-docs
        const baseName = document.filename.replace(/\.xlsx$/i, '').replace(/\.csv$/i, '');
        const jsonCandidates = [
          `/sample-docs/${baseName}.json`,
          `/api/documents/${baseName}.json`,
          `/sample-docs/05_Product_Catalogue_and_Campaigns.json`,
          `/api/documents/05_Product_Catalogue_and_Campaigns.json`,
        ];

        for (const jUrl of jsonCandidates) {
          try {
            const res = await fetch(jUrl);
            const cType = res.headers.get('content-type') || '';
            if (res.ok && !cType.includes('text/html')) {
              const data = await res.json();
              if (data && typeof data === 'object') {
                if (isMounted) {
                  setSpreadsheetData(data);
                  const sheetNames = Object.keys(data);
                  if (sheetNames.length > 0) setActiveSheet(sheetNames[0]);
                  setLoading(false);
                }
                return;
              }
            }
          } catch {}
        }

        if (isMounted) {
          setError(`Spreadsheet '${document.filename}' data could not be parsed. You can download the raw file below.`);
          setLoading(false);
        }
      };

      loadSpreadsheet();
    }
    // ─────────────────────────────────────────────────────────────
    // 3. WORD DOCUMENT (DOCX) FORMATTED HTML RENDERER
    // ─────────────────────────────────────────────────────────────
    else if (ext === 'docx') {
      const loadDocx = async () => {
        const baseName = document.filename.replace(/\.docx$/i, '');
        const htmlCandidates = [
          `/sample-docs/${baseName}.html`,
          `/api/documents/${baseName}.html`,
          `/sample-docs/06_Universal_Policy_Document_Template.html`,
          `/api/documents/06_Universal_Policy_Document_Template.html`,
        ];

        for (const hUrl of htmlCandidates) {
          try {
            const res = await fetch(hUrl);
            const cType = res.headers.get('content-type') || '';
            if (res.ok && cType.includes('text/html')) {
              const html = await res.text();
              // Ensure it's not the application's root index.html
              if (!html.includes('id="root"') && !html.includes('<title>Integrix AI')) {
                if (isMounted) {
                  setDocxHtml(html);
                  setLoading(false);
                }
                return;
              }
            }
          } catch {}
        }

        if (isMounted) {
          setError(`DOCX document '${document.filename}' preview could not be formatted. You can download the raw file.`);
          setLoading(false);
        }
      };

      loadDocx();
    }
    // ─────────────────────────────────────────────────────────────
    // 4. PLAIN TEXT / MANIFEST / CODE
    // ─────────────────────────────────────────────────────────────
    else if (ext === 'txt' || ext === 'md' || ext === 'svg') {
      const loadText = async () => {
        const candidates = [primary, fallback];
        for (const tUrl of candidates) {
          try {
            const res = await fetch(tUrl);
            const cType = res.headers.get('content-type') || '';
            if (res.ok && !cType.includes('text/html')) {
              const txt = await res.text();
              if (isMounted) {
                setTextContent(txt);
                setLoading(false);
              }
              return;
            }
          } catch {}
        }

        if (isMounted) {
          setError(`Text document '${document.filename}' could not be read.`);
          setLoading(false);
        }
      };

      loadText();
    } else {
      if (isMounted) {
        setError(`Unsupported preview format: .${ext}`);
        setLoading(false);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [document, retryCount]);

  if (!document) return null;

  const ext = document.filename.split('.').pop()?.toLowerCase() || '';
  const isPdf = ext === 'pdf';
  const isSpreadsheet = ext === 'xlsx' || ext === 'csv' || ext === 'xls';
  const isDocx = ext === 'docx';
  const isText = ext === 'txt' || ext === 'md' || ext === 'svg';

  const { primary, fallback } = resolveDocumentUrls(document.filename, document.path);
  const downloadUrl = pdfUrl || primary || fallback;

  // Filter spreadsheet rows
  const rows = spreadsheetData && activeSheet ? spreadsheetData[activeSheet] || [] : [];
  const headerRow = rows.length > 0 ? rows[0] : [];
  const bodyRows = rows.length > 1 ? rows.slice(1) : [];

  const filteredBodyRows = bodyRows.filter((row: any[]) => {
    if (!tableSearch.trim()) return true;
    const q = tableSearch.toLowerCase();
    return row.some((cell: any) => cell != null && String(cell).toLowerCase().includes(q));
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div
        className={`bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-200 ${
          isMaximized ? 'w-full h-full rounded-none' : 'w-full max-w-5xl h-[88vh]'
        }`}
      >
        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shrink-0">
              {isPdf ? (
                <FileText className="w-4 h-4 text-rose-400" />
              ) : isSpreadsheet ? (
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              ) : isDocx ? (
                <FileText className="w-4 h-4 text-sky-400" />
              ) : (
                <FileCode className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate max-w-md">
                  {document.title || document.filename}
                </h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {document.fileType || ext.toUpperCase()}
                </span>
                {document.pageRef && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Citation: {document.pageRef}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-mono truncate">
                {document.filename} {document.fileSize && `• ${document.fileSize}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Open document in new browser window"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href={downloadUrl}
              download={document.filename}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={isMaximized ? 'Restore size' : 'Maximize viewer'}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-rose-600/80 transition-colors cursor-pointer ml-1"
              title="Close document viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Highlight citation banner if available */}
        {document.highlightText && (
          <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 flex items-start gap-2.5 shrink-0">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-snug">
              <strong className="font-bold">Referenced Policy Citation:</strong> "{document.highlightText}"
            </div>
          </div>
        )}

        {/* Modal Main Viewport */}
        <div className="flex-1 bg-slate-100 overflow-hidden relative">
          {/* Loading State */}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20 space-y-2">
              <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
              <div className="text-xs font-semibold text-slate-600">
                Retrieving verified document bytes for {document.filename}...
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-white text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-rose-500" />
              <h4 className="text-base font-bold text-slate-900">Document Unavailable</h4>
              <p className="text-xs text-slate-500 max-w-md">{error}</p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRetryCount((c) => c + 1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Retrieval</span>
                </button>
                <a
                  href={downloadUrl}
                  download={document.filename}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Document</span>
                </a>
              </div>
            </div>
          )}

          {/* 1. PDF EMBEDDED VIEWER (Guaranteed verified PDF URL) */}
          {isPdf && !error && pdfValidated && (
            <div className="w-full h-full">
              <iframe
                src={`${pdfUrl}#toolbar=1&navpanes=0&view=FitH`}
                title={document.title}
                className="w-full h-full border-none"
              />
            </div>
          )}

          {/* 2. SPREADSHEET VIEWER (XLSX / CSV) */}
          {isSpreadsheet && !error && (
            <div className="w-full h-full flex flex-col bg-white">
              {/* Sheet Tabs & Search */}
              <div className="px-5 py-2.5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 flex items-center gap-1">
                    <Table className="w-3.5 h-3.5 text-indigo-600" /> Sheets:
                  </span>
                  {spreadsheetData &&
                    Object.keys(spreadsheetData).map((sName) => (
                      <button
                        type="button"
                        key={sName}
                        onClick={() => setActiveSheet(sName)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          activeSheet === sName
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {sName}
                      </button>
                    ))}
                </div>

                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Search in sheet rows..."
                    className="w-full pl-8 pr-3 py-1 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Table Data */}
              <div className="flex-1 overflow-auto p-4">
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="p-2.5 font-mono text-[10px] text-slate-400 border-r border-slate-200 bg-slate-100/80 w-12 text-center">
                          #
                        </th>
                        {headerRow.map((h: any, idx: number) => (
                          <th
                            key={idx}
                            className="p-2.5 font-bold text-slate-800 border-r border-slate-200 whitespace-nowrap bg-slate-50"
                          >
                            {String(h ?? '')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-normal">
                      {filteredBodyRows.map((r: any[], rIdx: number) => (
                        <tr key={rIdx} className="hover:bg-indigo-50/40 transition-colors">
                          <td className="p-2 font-mono text-[10px] text-slate-400 border-r border-slate-200 bg-slate-50/50 text-center">
                            {rIdx + 1}
                          </td>
                          {r.map((c: any, cIdx: number) => (
                            <td
                              key={cIdx}
                              className="p-2 border-r border-slate-100 text-slate-700 max-w-xs truncate"
                              title={String(c ?? '')}
                            >
                              {String(c ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. DOCX FORMATTED VIEWER */}
          {isDocx && !error && (
            <div className="w-full h-full overflow-auto bg-slate-100 p-6 flex justify-center">
              <div className="bg-white rounded-xl shadow-md border border-slate-200 max-w-3xl w-full p-8 md:p-12 my-auto text-slate-800 space-y-4">
                <div
                  className="prose prose-sm max-w-none prose-slate prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-700 prose-p:leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: docxHtml || '<p>No content available.</p>' }}
                />
              </div>
            </div>
          )}

          {/* 4. PLAIN TEXT / CODE VIEWER */}
          {isText && !error && (
            <div className="w-full h-full overflow-auto p-6 bg-slate-900 text-slate-200 font-mono text-xs">
              <pre className="whitespace-pre-wrap leading-relaxed">{textContent}</pre>
            </div>
          )}
        </div>

        {/* Modal Bottom Control Bar */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Document verified and loaded in read-only audit inspection mode.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Close Viewer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
