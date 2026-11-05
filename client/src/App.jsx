import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useSearchParams } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/app/AppLayout';
import RequireAuth from './components/app/RequireAuth';

// Public pages
import Home from './pages/Home';
import Login from './pages/Login';

// Signed-in pages
import Overview from './pages/app/Overview';
import Profile from './pages/app/Profile';
import Dashboard from './pages/Dashboard';
import DeviceDetails from './pages/DeviceDetails';
import RepairAnalysis from './pages/RepairAnalysis';
import KnowledgeAssistant from './pages/KnowledgeAssistant';

/** Marketing site chrome: floating navbar + footer. */
const PublicLayout = () => (
  <div className="relative flex min-h-screen flex-col bg-[#E6E8EA] font-sans text-slate-900 selection:bg-[#0d4a3e] selection:text-white">
    <Navbar />
    <main className="mx-auto w-full flex-1">
      <Outlet />
    </main>
    <Footer />
  </div>
);

/** Start each new page at the top instead of keeping the previous page's scroll position. */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    // Jump to an in-page section (e.g. /profile#history) once it has rendered; otherwise start at the top.
    const target = hash && document.getElementById(hash.slice(1));
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
};

/** Remount the analysis page per case so one case's results never leak into another. */
const RepairAnalysisRoute = () => {
  const [searchParams] = useSearchParams();
  return <RepairAnalysis key={searchParams.get('id') || 'current'} />;
};

/** Unknown URLs: signed-in users go to their overview, visitors to the home page. */
const FallbackRedirect = () => {
  const { user } = useAuth();
  return <Navigate to={user ? '/app' : '/'} replace />;
};

export function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Login />} />
          </Route>

          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route path="/app" element={<Overview />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/history" element={<Navigate to="/profile#history" replace />} />
            <Route path="/device" element={<DeviceDetails />} />
            <Route path="/analysis" element={<RepairAnalysisRoute />} />
            <Route path="/assistant" element={<KnowledgeAssistant />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<FallbackRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
