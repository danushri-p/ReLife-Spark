import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './components/app/AppLayout';
import RequireAuth from './components/app/RequireAuth';

// Public pages
import Home from './pages/Home';
import Login from './pages/Login';

// Signed-in pages
import Overview from './pages/app/Overview';
import History from './pages/app/History';
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

export function App() {
  return (
    <BrowserRouter>
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
            <Route path="/history" element={<History />} />
            <Route path="/device" element={<DeviceDetails />} />
            <Route path="/analysis" element={<RepairAnalysis />} />
            <Route path="/assistant" element={<KnowledgeAssistant />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>

          {/* Catch-all redirect to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
