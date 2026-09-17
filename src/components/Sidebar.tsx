import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  History,
  Bookmark,
  FileText,
  Library,
  ShieldCheck,
  Settings,
  Sparkles,
  Layers,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export function Sidebar() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/find', label: 'Find Standards', icon: Search },
    { to: '/history', label: 'Search History', icon: History },
    { to: '/saved', label: 'Saved Recommendations', icon: Bookmark },
    { to: '/library', label: 'Standards Library', icon: Library },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin Ingestion', icon: ShieldCheck }] : []),
    { to: '/settings', label: 'Model & Weights', icon: Settings }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col justify-between shrink-0 hidden md:flex min-h-[calc(100vh-61px)]">
      <div className="p-4 space-y-6">
        <div className="space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            Navigation
          </div>
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Quick Help Card */}
        <div className="p-3.5 bg-slate-800/80 border border-slate-700/60 rounded-xl space-y-2 text-xs">
          <div className="flex items-center gap-2 text-blue-400 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Recommendation RAG</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Input any natural language tender specification to extract entities, run semantic similarity against BIS chunks, and inspect explainable reasoning.
          </p>
          <div className="pt-1">
            <NavLink
              to="/find"
              className="inline-block w-full text-center py-1.5 px-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 rounded text-xs font-semibold transition-colors"
            >
              Start New Analysis →
            </NavLink>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
        <div className="font-semibold text-slate-400">Bureau of Indian Standards</div>
        <div>National Standards Repository</div>
        <div>Enterprise Decision Support</div>
      </div>
    </aside>
  );
}
