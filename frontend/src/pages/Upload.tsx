import { useState, type ChangeEvent, type DragEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, FileUp, UploadCloud, X, AlertCircle, Notebook } from 'lucide-react';
import { uploadPdf } from '../services/uploadService';
import { getApiError } from '../services/api';

function Upload() {
  const [params] = useSearchParams();
  const [notebookId, setNotebookId] = useState(params.get('notebook') || '');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const choose = (candidate: File | undefined) => {
    if (!candidate) return;
    if (candidate.type !== 'application/pdf') {
      setError('Only PDF files are allowed.');
      return;
    }
    setError('');
    setResult('');
    setFile(candidate);
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    choose(event.target.files?.[0]);
  };

  const onDragOver = (event: DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (event: DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    choose(event.dataTransfer.files[0]);
  };

  const submit = async () => {
    if (!file || !notebookId.trim()) {
      setError('Please choose a PDF and enter the notebook ID before uploading.');
      return;
    }
    setUploading(true);
    setError('');
    setResult('');
    try {
      const response = await uploadPdf(notebookId.trim(), file, setProgress);
      setResult(`${response.filename} is ${response.status}. ${response.total_pages} pages and ${response.total_chunks} chunks are ready.`);
    } catch (reason) {
      setError(getApiError(reason, 'PDF processing failed.'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <span className="inline-block px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 font-semibold text-xs uppercase tracking-wider border border-teal-100">
          Ingest Knowledge
        </span>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
          Upload a lecture PDF
        </h2>
        <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-2xl">
          The backend will extract, chunk, embed, and index your source material into the selected notebook for AI retrieval.
        </p>
      </div>

      {/* Form Panel */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
        
        {/* Notebook ID Input */}
        <div className="space-y-2">
          <label htmlFor="upload-notebook" className="block text-sm font-semibold text-slate-900">
            Target Notebook ID
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Notebook size={18} className="text-slate-400" />
            </div>
            <input
              id="upload-notebook"
              type="text"
              value={notebookId}
              onChange={(event) => setNotebookId(event.target.value)}
              placeholder="e.g., nb_8x92j1k..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>
          <p className="text-xs text-slate-500">
            Don't have an ID? <Link to="/notebooks" className="text-teal-700 font-medium hover:text-teal-900 hover:underline">Browse your notebooks</Link> to copy it.
          </p>
        </div>

        <div className="border-t border-slate-100 pt-6 space-y-4">
          <label className="block text-sm font-semibold text-slate-900">
            Document File
          </label>
          
          {/* Drop Zone */}
          {!file ? (
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`relative group flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer
                ${isDragging 
                  ? 'border-teal-500 bg-teal-50/50' 
                  : 'border-slate-300 hover:border-teal-400 hover:bg-slate-50'
                }`}
            >
              <input
                id="pdf-file"
                type="file"
                accept="application/pdf,.pdf"
                onChange={onChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="Choose PDF file"
              />
              <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200 border border-teal-100">
                <UploadCloud size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-900 mb-1">
                Drop your PDF here, or <span className="text-teal-700 underline">browse</span>
              </p>
              <p className="text-xs text-slate-500">
                Supports PDF files only
              </p>
            </div>
          ) : (
            /* Selected File State */
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shrink-0">
                  <FileUp size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setFile(null); setError(''); setResult(''); }}
                className="p-2 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                aria-label="Remove selected file"
                disabled={uploading}
              >
                <X size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {uploading && (
          <div className="space-y-2 animate-fade-in">
            <div className="flex justify-between text-xs font-medium text-slate-600">
              <span>Processing document...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-teal-600 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 animate-fade-in">
            <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {result && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 animate-fade-in">
            <CheckCircle2 size={18} className="text-teal-600 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{result}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="button"
          onClick={submit}
          disabled={uploading || !file || !notebookId.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-teal-800 text-white font-semibold text-sm 
            hover:bg-teal-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-teal-800
            transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing... {progress}%
            </>
          ) : (
            <>
              <UploadCloud size={18} />
              Upload and Process PDF
            </>
          )}
        </button>
      </div>
    </section>
  );
}

export default Upload;