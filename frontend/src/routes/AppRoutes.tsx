import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';

// ==================================================
// Lazy Loaded Pages (Code Splitting & Performance)
// ==================================================

const Dashboard = lazy(() => import('../pages/Dashboard'));
const Notebooks = lazy(() => import('../pages/Notebooks'));
const NotebookDetails = lazy(() => import('../pages/NotebookDetails'));
const Documents = lazy(() => import('../pages/Documents'));
const DocumentDetails = lazy(() => import('../pages/DocumentDetails'));
const Upload = lazy(() => import('../pages/Upload'));
const Chat = lazy(() => import('../pages/Chat'));
const Settings = lazy(() => import('../pages/Settings'));
const NotFound = lazy(() => import('../pages/NotFound'));

// ==================================================
// Premium Loading Fallback
// ==================================================
// Aligned with ProfessorMind AI Teal/Gold design system

const PageLoader = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm transition-colors duration-300">
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 animate-ping rounded-full bg-teal-400 opacity-20"></div>
        <div className="absolute inset-0 animate-pulse rounded-full bg-teal-500 opacity-40"></div>
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-teal-600 to-teal-800 shadow-lg shadow-teal-500/30 flex items-center justify-center">
          <span className="text-white font-bold text-sm">P</span>
        </div>
      </div>
      <p className="text-sm font-medium text-slate-600 animate-pulse">
        Loading workspace...
      </p>
    </div>
  </div>
);

// ==================================================
// Scroll Restoration for SPA Navigation
// ==================================================

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Instant scroll to top on route change to prevent disorienting UX 
    // (smooth scrolling is better for in-page anchors, instant for route changes)
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

// ==================================================
// Application Routes
// ==================================================

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ScrollToTop />
      <Routes>
        <Route element={<MainLayout />}>
          {/* Redirect root to dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          {/* Core Workspace Routes */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="notebooks" element={<Notebooks />} />
          <Route path="notebooks/:notebookId" element={<NotebookDetails />} />
          <Route path="documents" element={<Documents />} />
          <Route path="documents/:documentId" element={<DocumentDetails />} />
          <Route path="upload" element={<Upload />} />
          <Route path="chat" element={<Chat />} />
          <Route path="settings" element={<Settings />} />
          
          {/* Catch-all 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;