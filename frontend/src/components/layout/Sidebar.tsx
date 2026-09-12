import { NavLink } from 'react-router-dom';
import { 
  BookOpen, 
  FileText, 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  UploadCloud,
  X
} from 'lucide-react';

// ==================================================
// Navigation Configuration
// ==================================================

const navigation = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Notebooks', to: '/notebooks', icon: BookOpen },
  { label: 'Documents', to: '/documents', icon: FileText },
  { label: 'Upload PDF', to: '/upload', icon: UploadCloud },
  { label: 'AI Chat', to: '/chat', icon: MessageSquare },
  { label: 'Settings', to: '/settings', icon: Settings },
];

// ==================================================
// Premium Navigation Link Component
// ==================================================

interface AppNavLinkProps {
  to: string;
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}

function AppNavLink({ to, icon: Icon, label, onClick }: AppNavLinkProps) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out
        ${isActive 
          ? 'bg-teal-50 text-teal-900 border border-teal-200 shadow-sm' 
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon 
            size={18} 
            strokeWidth={isActive ? 2 : 1.5} 
            className={`transition-colors duration-200 ${isActive ? 'text-teal-700' : 'text-slate-400 group-hover:text-slate-600'}`} 
          />
          <span className="tracking-tight">{label}</span>
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-teal-600 rounded-r-full" />
          )}
        </>
      )}
    </NavLink>
  );
}

// ==================================================
// Sidebar Component
// ==================================================

interface SidebarProps {
  onClose?: () => void;
  isMobile?: boolean;
}

export default function Sidebar({ onClose, isMobile }: SidebarProps) {
  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 p-5 shrink-0 justify-between">
      <div className="space-y-8">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-1 pt-1">
          <NavLink to="/dashboard" className="flex items-center gap-3 group" onClick={onClose}>
            <div className="w-10 h-10 rounded-lg bg-teal-900 flex items-center justify-center font-bold text-lg text-white shadow-sm transition-transform duration-200 group-hover:scale-105 group-hover:bg-teal-800">
              P
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight leading-none text-slate-900">ProfessorMind</span>
              <span className="text-[11px] text-slate-500 font-medium tracking-wide mt-0.5">Academic Workspace</span>
            </div>
          </NavLink>
          
          {isMobile && onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav aria-label="Primary navigation" className="space-y-1">
          {navigation.map((item) => (
            <AppNavLink 
              key={item.to} 
              to={item.to} 
              icon={item.icon} 
              label={item.label} 
              onClick={isMobile ? onClose : undefined} 
            />
          ))}
        </nav>
      </div>

      {/* Sidebar Footer Status */}
      <div className="px-3 py-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-3 text-xs text-slate-600">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-600"></span>
        </span>
        <span className="font-medium tracking-wide truncate">RAG Workspace Active</span>
      </div>
    </div>
  );
}