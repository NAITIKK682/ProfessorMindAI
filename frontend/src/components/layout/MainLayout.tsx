import { useState, useEffect, useCallback } from 'react';

import { NavLink, Outlet, useLocation } from 'react-router-dom';

import {
  BookOpen,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Settings,
  UploadCloud,
  Menu,
  X,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';

import { useAppContext } from '../../context/AppContext';

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

function AppNavLink({
  to,
  icon: Icon,
  label,
  onClick,
}: AppNavLinkProps) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out
        ${
          isActive
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
            className={`transition-colors duration-200 ${
              isActive
                ? 'text-teal-700'
                : 'text-slate-400 group-hover:text-slate-600'
            }`}
          />

          <span className="tracking-tight">
            {label}
          </span>

          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-teal-600 rounded-r-full" />
          )}
        </>
      )}
    </NavLink>
  );
}

// ==================================================
// Sidebar Content Component
// ==================================================

interface SidebarContentProps {
  onClose?: () => void;
  isMobile?: boolean;
}

function SidebarContent({
  onClose,
  isMobile,
}: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 p-5 shrink-0 justify-between">

      <div className="space-y-8">

        {/* ==================================================
            Brand Header
        ================================================== */}

        <div className="flex items-center justify-between px-1 pt-1">

          <NavLink
            to="/dashboard"
            className="flex items-center gap-3 group min-w-0"
            onClick={onClose}
          >

            {/* ==================================================
                ProfessorMind AI Logo
            ================================================== */}

            <div
              className="
                relative
                w-12
                h-12
                shrink-0
                rounded-xl
                overflow-hidden
                flex
                items-center
                justify-center
                bg-slate-950
                border
                border-slate-200
                shadow-md
                transition-all
                duration-300
                group-hover:scale-105
                group-hover:shadow-lg
              "
            >

              <img
                src="/images/professormind-logo.png"
                alt="ProfessorMind AI Logo"
                className="
                  w-full
                  h-full
                  object-contain
                  scale-[1.12]
                  transition-transform
                  duration-300
                  group-hover:scale-[1.18]
                "
              />

            </div>

            {/* ==================================================
                Brand Text
            ================================================== */}

            <div className="flex flex-col min-w-0">

              <span
                className="
                  font-bold
                  text-base
                  tracking-tight
                  leading-none
                  text-slate-900
                  truncate
                "
              >
                ProfessorMind
              </span>

              <span
                className="
                  text-[11px]
                  text-slate-500
                  font-medium
                  tracking-wide
                  mt-1
                  truncate
                "
              >
                Academic Workspace
              </span>

            </div>

          </NavLink>

          {/* Mobile Close Button */}

          {isMobile && onClose && (
            <button
              onClick={onClose}
              className="
                p-2
                rounded-lg
                text-slate-500
                hover:bg-slate-100
                hover:text-slate-900
                transition-colors
                ml-2
              "
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          )}

        </div>

        {/* ==================================================
            Navigation Links
        ================================================== */}

        <nav
          aria-label="Primary navigation"
          className="space-y-1"
        >
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

      {/* ==================================================
          Sidebar Footer Status
      ================================================== */}

      <div
        className="
          px-3
          py-3
          rounded-lg
          bg-slate-50
          border
          border-slate-200
          flex
          items-center
          gap-3
          text-xs
          text-slate-600
        "
      >

        <span className="relative flex h-2.5 w-2.5">

          <span
            className="
              animate-ping
              absolute
              inline-flex
              h-full
              w-full
              rounded-full
              bg-teal-500
              opacity-75
            "
          />

          <span
            className="
              relative
              inline-flex
              rounded-full
              h-2.5
              w-2.5
              bg-teal-600
            "
          />

        </span>

        <span className="font-medium tracking-wide truncate">
          RAG Workspace Active
        </span>

      </div>

    </div>
  );
}

// ==================================================
// Main Layout Shell
// ==================================================

function MainLayout() {
  const location = useLocation();

  const { theme, toggleTheme } = useAppContext();

  const [isMobileMenuOpen, setIsMobileMenuOpen] =
    useState(false);

  const current = navigation.find((item) =>
    location.pathname.startsWith(item.to)
  );

  // ==================================================
  // Close mobile menu on route change
  // ==================================================

  useEffect(() => {
    const timer = window.setTimeout(
      () => setIsMobileMenuOpen(false),
      0
    );

    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  // ==================================================
  // Prevent body scroll when mobile menu is open
  // ==================================================

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // ==================================================
  // Mobile Menu Handlers
  // ==================================================

  const handleToggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const handleCloseMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  // ==================================================
  // Render
  // ==================================================

  return (
    <div className="flex h-screen bg-slate-50 font-sans antialiased text-slate-800 overflow-hidden">

      {/* ==================================================
          DESKTOP SIDEBAR
      ================================================== */}

      <aside className="hidden lg:flex lg:flex-col lg:w-64">
        <SidebarContent />
      </aside>

      {/* ==================================================
          MOBILE SIDEBAR OVERLAY
      ================================================== */}

      {isMobileMenuOpen && (
        <div
          className="
            fixed
            inset-0
            z-40
            bg-slate-900/40
            backdrop-blur-sm
            lg:hidden
            transition-opacity
            duration-300
          "
          onClick={handleCloseMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* ==================================================
          MOBILE SIDEBAR DRAWER
      ================================================== */}

      <aside
        className={`
          fixed
          inset-y-0
          left-0
          z-50
          w-72
          transform
          transition-transform
          duration-300
          ease-out
          lg:hidden
          ${
            isMobileMenuOpen
              ? 'translate-x-0'
              : '-translate-x-full'
          }
        `}
      >
        <SidebarContent
          onClose={handleCloseMobileMenu}
          isMobile
        />
      </aside>

      {/* ==================================================
          MAIN CONTENT AREA
      ================================================== */}

      <div className="flex flex-col flex-1 overflow-hidden">

        {/* ==================================================
            TOPBAR
        ================================================== */}

        <header
          className="
            sticky
            top-0
            z-30
            flex
            items-center
            justify-between
            h-16
            px-4
            sm:px-6
            lg:px-8
            border-b
            border-slate-200
            bg-white/80
            backdrop-blur-md
          "
        >

          <div className="flex items-center gap-4">

            {/* Mobile Menu Button */}

            <button
              onClick={handleToggleMobileMenu}
              className="
                p-2
                rounded-lg
                text-slate-500
                hover:bg-slate-100
                hover:text-slate-900
                transition-colors
                lg:hidden
              "
              aria-label="Toggle navigation menu"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb / Page Title */}

            <div>

              <p
                className="
                  text-[10px]
                  font-bold
                  tracking-widest
                  text-teal-700
                  uppercase
                  mb-0.5
                "
              >
                ProfessorMind AI
              </p>

              <h1
                className="
                  text-lg
                  sm:text-xl
                  font-bold
                  text-slate-900
                  tracking-tight
                "
              >
                {current?.label ?? 'Workspace'}
              </h1>

            </div>

          </div>

          {/* ==================================================
              TOPBAR ACTIONS
          ================================================== */}

          <div className="flex items-center gap-3">

            {/* Theme Toggle */}

            <button
              onClick={toggleTheme}
              className="
                p-2
                rounded-lg
                text-slate-500
                hover:bg-slate-100
                hover:text-slate-800
                transition-all
                duration-200
              "
              aria-label={`Switch to ${
                theme === 'light'
                  ? 'dark'
                  : 'light'
              } mode`}
            >
              {theme === 'light' ? (
                <Moon size={18} />
              ) : (
                <Sun size={18} />
              )}
            </button>

            {/* AI Assistant Status */}

            <span
              className="
                hidden
                sm:inline-flex
                items-center
                gap-2
                px-3
                py-1.5
                rounded-full
                bg-teal-50
                border
                border-teal-200
                text-xs
                font-semibold
                text-teal-800
              "
            >

              <Sparkles
                size={14}
                className="text-teal-600"
              />

              AI Assistant Ready

            </span>

          </div>

        </header>

        {/* ==================================================
            PAGE CONTENT
        ================================================== */}

        <main
          className="
            flex-1
            overflow-y-auto
            bg-slate-50
          "
        >

          <div
            className="
              mx-auto
              max-w-7xl
              w-full
              p-4
              sm:p-6
              lg:p-8
            "
          >
            <Outlet />
          </div>

        </main>

      </div>

    </div>
  );
}

export default MainLayout;