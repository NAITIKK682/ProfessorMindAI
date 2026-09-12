import { useEffect, useState, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  UploadCloud, 
  FolderOpen,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getApiError } from '../services/api';
import { listDocuments } from '../services/documentService';
import type { DocumentGroup } from '../types/api';

function Documents() {
  const [groups, setGroups] = useState<DocumentGroup[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    listDocuments()
      .then((data) => setGroups(data.notebooks))
      .catch((reason: unknown) => setError(getApiError(reason)))
      .finally(() => setLoading(false));
  }, []);

  const count = groups.reduce((sum, group) => sum + group.documents.length, 0);

  // Client-side search filter
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const query = searchQuery.toLowerCase();
    return groups
      .map((group) => ({
        ...group,
        documents: group.documents.filter(
          (doc) =>
            doc.filename.toLowerCase().includes(query) ||
            group.notebook_name.toLowerCase().includes(query)
        ),
      }))
      .filter((group) => group.documents.length > 0);
  }, [groups, searchQuery]);

  const filteredCount = filteredGroups.reduce(
    (sum, group) => sum + group.documents.length,
    0
  );

  const getStatusBadge = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === 'completed' || normalized === 'ready') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100 text-xs font-medium">
          <CheckCircle2 size={12} />
          {status}
        </span>
      );
    }
    if (normalized === 'processing' || normalized === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-xs font-medium">
          <Clock size={12} />
          {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200 text-xs font-medium">
        {status}
      </span>
    );
  };

  return (
    <section className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      
      {/* ==========================================
          PAGE HEADER
          ========================================== */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <span className="inline-block px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 font-semibold text-xs uppercase tracking-wider border border-teal-100">
            Source Material
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            All Documents
          </h2>
          <p className="text-slate-500 text-sm">
            {loading ? (
              'Loading your documents...'
            ) : (
              <>
                {count} document{count === 1 ? '' : 's'} across your notebooks
                {searchQuery.trim() && ` · ${filteredCount} matching`}
              </>
            )}
          </p>
        </div>

        <Link
          to="/upload"
          className="inline-flex items-center gap-2 bg-teal-800 hover:bg-teal-900 text-white font-medium text-sm px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 shrink-0"
        >
          <UploadCloud size={16} />
          Upload PDF
        </Link>
      </div>

      {/* ==========================================
          SEARCH BAR
          ========================================== */}
      {!loading && count > 0 && (
        <div className="relative max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents or notebooks..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm"
            aria-label="Search documents"
          />
        </div>
      )}

      {/* ==========================================
          ERROR STATE
          ========================================== */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 animate-fade-in">
          <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Failed to load documents</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* ==========================================
          LOADING SKELETON
          ========================================== */}
      {loading && (
        <div className="space-y-6">
          {[1, 2].map((groupIdx) => (
            <div key={groupIdx} className="space-y-3">
              <div className="h-5 w-40 rounded bg-slate-100 animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((cardIdx) => (
                  <div
                    key={cardIdx}
                    className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 animate-pulse"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-slate-100" />
                        <div className="h-3 w-1/2 rounded bg-slate-100" />
                      </div>
                    </div>
                    <div className="h-3 w-1/3 rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==========================================
          EMPTY STATE
          ========================================== */}
      {!loading && count === 0 && (
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-white rounded-xl border-2 border-dashed border-slate-200 hover:border-teal-300 transition-colors duration-200">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4">
            <FolderOpen size={28} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No documents uploaded yet
          </h3>
          <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
            Upload your first lecture PDF to start building your private academic
            knowledge base. Your documents will appear here once processed.
          </p>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 bg-teal-800 hover:bg-teal-900 text-white font-medium text-sm px-5 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
          >
            <UploadCloud size={16} />
            Upload your first PDF
          </Link>
        </div>
      )}

      {/* ==========================================
          NO SEARCH RESULTS
          ========================================== */}
      {!loading && count > 0 && filteredCount === 0 && (
        <div className="flex flex-col items-center justify-center text-center py-12 px-4 bg-white rounded-xl border border-slate-200">
          <Search size={28} className="text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-900 mb-1">
            No matching documents
          </h3>
          <p className="text-sm text-slate-500">
            Try adjusting your search query.
          </p>
        </div>
      )}

      {/* ==========================================
          DOCUMENT GROUPS
          ========================================== */}
      {!loading && filteredCount > 0 && (
        <div className="space-y-8">
          {filteredGroups.map((group) => (
            <div key={group.notebook_id || group.notebook_name} className="space-y-3">
              {/* Group Header */}
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <FolderOpen size={16} className="text-teal-600" />
                <h3 className="text-sm font-semibold text-slate-700 tracking-tight">
                  {group.notebook_name}
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                  {group.documents.length} doc{group.documents.length === 1 ? '' : 's'}
                </span>
              </div>

              {/* Document Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.documents.map((document) => (
                  <Link
                    to={`/documents/${document.file_id}`}
                    key={document.file_id}
                    className="group flex flex-col bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-teal-200 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center border border-red-100 shrink-0 group-hover:scale-105 transition-transform duration-200">
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold text-slate-900 truncate group-hover:text-teal-800 transition-colors leading-snug">
                          {document.filename}
                        </h4>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>
                          {document.total_pages ?? '—'} pages
                        </span>
                      </div>
                      {getStatusBadge(document.status)}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-400 truncate">
                        {group.notebook_name}
                      </span>
                      <ArrowRight
                        size={14}
                        className="text-slate-300 group-hover:text-teal-600 group-hover:translate-x-1 transition-all shrink-0"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default Documents;