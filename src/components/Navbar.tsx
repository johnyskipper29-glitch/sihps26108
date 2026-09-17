import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Shield, Sparkles, UserCheck, LogOut, ChevronDown, Check, RefreshCw, BookOpen } from 'lucide-react';

export function Navbar() {
  const { user, logout, switchUser } = useAuth();
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(d => setHasGeminiKey(d.has_gemini_key))
      .catch(() => {});
  }, []);

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
      <div className="px-4 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black shadow-sm">
            IS
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">
              Indian Standards AI Recommendation Engine
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              Bureau of Indian Standards (BIS) • Procurement Decision Support System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* AI Mode indicator */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 border border-slate-700">
            <Sparkles className={`w-3.5 h-3.5 ${hasGeminiKey ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className="text-slate-200">
              {hasGeminiKey ? 'AI Hybrid Mode (Gemini + ChromaDB)' : 'Demo / Fallback AI Mode'}
            </span>
          </div>

          {/* User selector & role indicator */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium transition-colors"
            >
              <div className="w-5 h-5 rounded-full bg-blue-500 text-[10px] flex items-center justify-center font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-white font-semibold leading-tight">{user?.name}</div>
                <div className="text-[10px] text-slate-400 leading-none">
                  {user?.role === 'ADMIN' ? 'Admin' : 'Procurement Officer'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 text-xs text-slate-700 z-50">
                <div className="px-3 py-2 border-b border-slate-100">
                  <div className="font-bold text-slate-900">{user?.name}</div>
                  <div className="text-slate-500">{user?.email}</div>
                  <div className="text-[10px] text-blue-600 font-semibold mt-0.5">{user?.department}</div>
                </div>

                <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch Demo Persona
                </div>

                <button
                  onClick={() => {
                    switchUser('PROCUREMENT_OFFICER');
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-50 ${
                    user?.role === 'PROCUREMENT_OFFICER' ? 'bg-blue-50 text-blue-700 font-semibold' : ''
                  }`}
                >
                  <span>Procurement Officer (Standard)</span>
                  {user?.role === 'PROCUREMENT_OFFICER' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>

                <button
                  onClick={() => {
                    switchUser('ADMIN');
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-50 ${
                    user?.role === 'ADMIN' ? 'bg-blue-50 text-blue-700 font-semibold' : ''
                  }`}
                >
                  <span>Chief Admin (Upload & Config)</span>
                  {user?.role === 'ADMIN' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>

                <div className="border-t border-slate-100 my-1"></div>

                <button
                  onClick={() => {
                    logout();
                    setDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
