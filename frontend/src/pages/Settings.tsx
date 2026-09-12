import { 
  Server, 
  Cpu, 
  Database, 
  Monitor, 
  Moon, 
  Sun, 
  CheckCircle2 
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

function Settings() {
  const { theme, toggleTheme } = useAppContext();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001';

  return (
    <section className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      
      {/* ==========================================
          PAGE HEADER
          ========================================== */}
      <div className="space-y-2">
        <span className="inline-block px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 font-semibold text-xs uppercase tracking-wider border border-teal-100">
          Workspace
        </span>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
          Settings
        </h2>
        <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-2xl">
          Connection details and preferences for your local ProfessorMind workspace.
        </p>
      </div>

      {/* ==========================================
          SYSTEM INFORMATION
          ========================================== */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
            System Information
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Current configuration of your local environment.
          </p>
        </div>
        
        <div className="divide-y divide-slate-100">
          {/* API Endpoint */}
          <div className="flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 shrink-0">
                <Server size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">API Endpoint</p>
                <p className="text-xs text-slate-500 mt-0.5">FastAPI server address</p>
              </div>
            </div>
            <div className="text-right">
              <code className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1.5 rounded-md border border-slate-200">
                {apiUrl}
              </code>
            </div>
          </div>

          {/* Inference Engine */}
          <div className="flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
                <Cpu size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Inference Engine</p>
                <p className="text-xs text-slate-500 mt-0.5">AI model processing backend</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <span className="hidden sm:inline">Local Ollama</span>
              <span className="px-2 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold border border-teal-100">
                Active
              </span>
            </div>
          </div>

          {/* Data Storage */}
          <div className="flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                <Database size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Data Storage</p>
                <p className="text-xs text-slate-500 mt-0.5">Vector database and file system</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-700">Local SQLite</p>
              <p className="text-xs text-slate-500 mt-0.5">+ Notebook Files</p>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          PREFERENCES
          ========================================== */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
            Preferences
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Customize your workspace experience.
          </p>
        </div>
        
        <div className="divide-y divide-slate-100">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200 shrink-0">
                {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Appearance</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Currently using <span className="font-medium text-slate-700">{theme} mode</span>
                </p>
              </div>
            </div>
            
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30 focus-visible:ring-offset-2 ${
                theme === 'dark' ? 'bg-teal-700' : 'bg-slate-200'
              }`}
              role="switch"
              aria-checked={theme === 'dark'}
              aria-label="Toggle dark mode"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Status Indicator (Read-only) */}
          <div className="flex items-center justify-between p-5 bg-teal-50/30">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center border border-teal-200 shrink-0">
                <Monitor size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-teal-900">Workspace Status</p>
                <p className="text-xs text-teal-700 mt-0.5">
                  All systems operational
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-100 px-2.5 py-1 rounded-full border border-teal-200">
              <CheckCircle2 size={14} />
              Healthy
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          FOOTER INFO
          ========================================== */}
      <div className="text-center pt-4 pb-8">
        <p className="text-xs text-slate-400">
          ProfessorMind AI &middot; Private Academic Knowledge Workspace
        </p>
        <p className="text-[10px] text-slate-300 mt-1">
          v1.0.0 &middot; Local Environment
        </p>
      </div>
    </section>
  );
}

export default Settings;