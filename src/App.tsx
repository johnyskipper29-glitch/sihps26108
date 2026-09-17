import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { Sidebar } from './components/Sidebar.js';

import { DashboardPage } from './pages/DashboardPage.js';
import { FindStandardsPage } from './pages/FindStandardsPage.js';
import { ResultsPage } from './pages/ResultsPage.js';
import { StandardsLibraryPage } from './pages/StandardsLibraryPage.js';
import { HistoryPage } from './pages/HistoryPage.js';
import { SavedPage } from './pages/SavedPage.js';
import { AdminPage } from './pages/AdminPage.js';
import { SettingsPage } from './pages/SettingsPage.js';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-slate-100 font-sans text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
          <Navbar />
          <div className="flex-1 flex overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/find" element={<FindStandardsPage />} />
                <Route path="/results/:searchId" element={<ResultsPage />} />
                <Route path="/library" element={<StandardsLibraryPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/saved" element={<SavedPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
