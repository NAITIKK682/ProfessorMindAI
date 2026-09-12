import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  FolderPlus, 
  AlertCircle,
  Loader2,
  ArrowRight,
  FileText
} from 'lucide-react';
import { createNotebook, deleteNotebook, listNotebooks } from '../services/notebookService';
import { getApiError } from '../services/api';
import type { Notebook } from '../types/notebook';
import ConfirmDialog from '../components/common/ConfirmDialog';

function Notebooks() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Confirm Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [notebookToDelete, setNotebookToDelete] = useState<string | null>(null);

  const load = () =>
    listNotebooks()
      .then((data) => setNotebooks(data.notebooks))
      .catch((reason: unknown) => setError(getApiError(reason)))
      .finally(() => setLoading(false));

  useEffect(() => {
    void load();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError('');
    try {
      await createNotebook({ name: name.trim(), description: description.trim() || null });
      setName('');
      setDescription('');
      await load();
    } catch (reason) {
      setError(getApiError(reason));
    } finally {
      setCreating(false);
    }
  };

  // Trigger the custom confirm dialog
  const requestDelete = (id: string) => {
    setNotebookToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  // Execute deletion after confirmation
  const handleConfirmDelete = async () => {
    if (!notebookToDelete) return;
    setIsDeleteDialogOpen(false);
    
    try {
      await deleteNotebook(notebookToDelete);
      setNotebooks((items) => items.filter((item) => item.notebook_id !== notebookToDelete));
      setNotebookToDelete(null);
    } catch (reason) {
      setError(getApiError(reason));
    }
  };

  return (
    <section className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* ==========================================
          PAGE HEADER
          ========================================== */}
      <div className="space-y-1">
        <span className="inline-block px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 font-semibold text-xs uppercase tracking-wider border border-teal-100">
          Knowledge Library
        </span>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
          Your Notebooks
        </h2>
        <p className="text-slate-500 text-sm">
          Keep each course or research topic in its own retrieval space.
        </p>
      </div>

      {/* ==========================================
          ERROR STATE
          ========================================== */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 animate-fade-in">
          <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Action failed</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* ==========================================
          CREATE NOTEBOOK FORM
          ========================================== */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 md:p-6">
        <form onSubmit={submit} className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="notebook-name" className="block text-sm font-semibold text-slate-900">
                Notebook Name
              </label>
              <input
                id="notebook-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Machine Learning"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="notebook-desc" className="block text-sm font-semibold text-slate-900">
                Description <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                id="notebook-desc"
                type="text"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Brief summary of the topic"
                aria-label="Notebook description"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="inline-flex items-center justify-center gap-2 bg-teal-800 hover:bg-teal-900 text-white font-medium text-sm px-5 py-2.5 rounded-lg shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-teal-800 transition-all duration-200 shrink-0 h-[42px]"
          >
            {creating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus size={16} />
                Create Notebook
              </>
            )}
          </button>
        </form>
      </div>

      {/* ==========================================
          LOADING SKELETON
          ========================================== */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-slate-100" />
                  <div className="h-3 w-1/2 rounded bg-slate-100" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-slate-100" />
                <div className="h-3 w-2/3 rounded bg-slate-100" />
              </div>
              <div className="h-8 w-24 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      )}

      {/* ==========================================
          EMPTY STATE
          ========================================== */}
      {!loading && notebooks.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-white rounded-xl border-2 border-dashed border-slate-200 hover:border-teal-300 transition-colors duration-200">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-4">
            <FolderPlus size={28} className="text-teal-700" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No notebooks yet
          </h3>
          <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
            Create your first notebook to organize your lecture knowledge and research materials.
          </p>
        </div>
      )}

      {/* ==========================================
          NOTEBOOKS GRID
          ========================================== */}
      {!loading && notebooks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {notebooks.map((notebook) => (
            <article
              key={notebook.notebook_id}
              className="group flex flex-col bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-teal-200 transition-all duration-200"
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0 group-hover:scale-105 transition-transform duration-200">
                  <BookOpen size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-slate-900 truncate leading-snug group-hover:text-teal-800 transition-colors">
                    {notebook.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                    <FileText size={12} />
                    <span>
                      {notebook.total_documents} document{notebook.total_documents === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-500 leading-relaxed mb-4 flex-1 line-clamp-2">
                {notebook.description || 'No description provided.'}
              </p>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                <Link
                  to={`/notebooks/${notebook.notebook_id}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-900 transition-colors group/link"
                >
                  Open
                  <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                </Link>
                <button
                  type="button"
                  onClick={() => requestDelete(notebook.notebook_id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  aria-label={`Delete ${notebook.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ==========================================
          CUSTOM CONFIRM DIALOG
          ========================================== */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Notebook"
        message="Are you sure you want to delete this notebook and all its associated documents? This action cannot be undone."
        confirmLabel="Delete Notebook"
        cancelLabel="Cancel"
      />
    </section>
  );
}

export default Notebooks;