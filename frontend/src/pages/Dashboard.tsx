import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  BookOpen, 
  FileText, 
  UploadCloud, 
  Loader2, 
  Zap, 
  GraduationCap,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getApiError } from '../services/api';
import { listDocuments } from '../services/documentService';
import { listNotebooks } from '../services/notebookService';
import type { DocumentGroup } from '../types/api';
import type { Notebook } from '../types/notebook';

function Dashboard() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [groups, setGroups] = useState<DocumentGroup[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([listNotebooks(), listDocuments()])
      .then(([notebookData, documentData]) => {
        setNotebooks(notebookData.notebooks || []);
        setGroups(documentData.notebooks || []);
      })
      .catch((reason: unknown) => setError(getApiError(reason)))
      .finally(() => setIsLoading(false));
  }, []);

  const documentCount = groups.reduce((sum, group) => sum + (group.total_documents || 0), 0);
  const documents = groups.flatMap((group) => group.documents || []).slice(0, 5);

  return (
    <section className="space-y-6 md:space-y-8 animate-fade-in max-w-7xl mx-auto">
      
      {/* ==========================================
          HERO BANNER
          ========================================== */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-50 via-white to-amber-50/40 border border-teal-100 p-6 md:p-10 shadow-sm">
        <div className="max-w-2xl relative z-10 space-y-4">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-800 font-semibold text-xs uppercase tracking-wider">
            <Sparkles size={14} />
            Your Private Study Space
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
            Turn lecture material into <span className="text-teal-700">confident answers</span>.
          </h2>
          <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-lg">
            Organize course PDFs into focused notebooks and ask questions grounded in your own verified academic sources.
          </p>
          <div className="pt-2">
            <Link 
              to="/upload" 
              className="inline-flex items-center gap-2 bg-teal-800 hover:bg-teal-900 text-white font-medium text-sm px-5 py-2.5 rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <UploadCloud size={18} />
              Upload a PDF
            </Link>
          </div>
        </div>

        {/* Decorative Graphic Element */}
        <div className="absolute -right-12 -bottom-12 opacity-[0.03] pointer-events-none hidden md:block">
          <GraduationCap size={360} className="text-teal-900" />
        </div>
      </div>

      {/* ==========================================
          ERROR STATE
          ========================================== */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 animate-fade-in">
          <div className="mt-0.5 text-red-600 shrink-0">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold">Failed to load workspace data</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* ==========================================
          STATS GRID
          ========================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Notebooks Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-200 transition-all duration-200 flex items-center justify-between group">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Notebooks</p>
            <div className="text-2xl md:text-3xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="animate-spin h-6 w-6 text-slate-400" /> : notebooks.length}
            </div>
          </div>
          <div className="w-12 h-12 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 group-hover:scale-105 transition-transform duration-200">
            <BookOpen size={22} />
          </div>
        </div>

        {/* Documents Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-200 transition-all duration-200 flex items-center justify-between group">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Documents</p>
            <div className="text-2xl md:text-3xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="animate-spin h-6 w-6 text-slate-400" /> : documentCount}
            </div>
          </div>
          <div className="w-12 h-12 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 group-hover:scale-105 transition-transform duration-200">
            <FileText size={22} />
          </div>
        </div>

        {/* AI Workspace Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-200 flex items-center justify-between group">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Workspace</p>
            <div className="text-2xl md:text-3xl font-bold text-teal-700 flex items-center gap-2">
              {isLoading ? <Loader2 className="animate-spin h-6 w-6 text-slate-400" /> : 'Ready'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 group-hover:scale-105 transition-transform duration-200">
            <Zap size={22} />
          </div>
        </div>
      </div>

      {/* ==========================================
          RECENT SOURCES
          ========================================== */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-1">
              Recent Sources
            </p>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Continue your research
            </h2>
          </div>
          <Link 
            to="/documents" 
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-900 transition-colors group"
          >
            View all
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 animate-pulse">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-slate-100" />
                    <div className="h-3 w-1/4 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            /* Empty State Container */
            <div className="w-full bg-white rounded-xl border-2 border-dashed border-slate-200 p-10 md:p-12 text-center hover:border-teal-300 hover:bg-teal-50/30 transition-all duration-200 flex flex-col items-center justify-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-200">
                <FileText size={28} />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-slate-900">
                  No documents uploaded yet
                </h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Upload your first lecture PDF to start building your private academic knowledge base.
                </p>
              </div>
              <Link 
                to="/upload" 
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-teal-800 font-medium text-sm px-4 py-2.5 rounded-lg border border-slate-300 hover:border-teal-300 shadow-sm transition-all duration-200"
              >
                <UploadCloud size={16} />
                Upload first document
              </Link>
            </div>
          ) : (
            /* Populated Document List */
            <div className="space-y-3">
              {documents.map((document) => (
                <Link
                  to={`/documents/${document.file_id}`}
                  key={document.file_id}
                  className="group flex items-center justify-between p-4 rounded-xl bg-white hover:bg-teal-50/40 border border-slate-200 hover:border-teal-200 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <span className="flex-shrink-0 p-2.5 rounded-lg bg-teal-50 text-teal-700 group-hover:scale-105 transition-transform border border-teal-100">
                      <FileText size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <strong className="block text-slate-900 font-semibold truncate group-hover:text-teal-900 transition-colors">
                        {document.filename}
                      </strong>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-slate-500 text-xs">
                          {document.total_pages ?? 'Unknown'} pages
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          document.status === 'completed' 
                            ? 'bg-teal-50 text-teal-700 border border-teal-100' 
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {document.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-slate-400 group-hover:text-teal-700 group-hover:translate-x-1 transition-all ml-4 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default Dashboard;