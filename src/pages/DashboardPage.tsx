import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Layers,
  FileCheck,
  BarChart2,
  Clock,
  ExternalLink
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#2563eb', '#0284c7', '#0d9488', '#16a34a', '#ca8a04', '#ea580c', '#9333ea', '#4f46e5'];

export function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/statistics').then(r => r.json()),
      fetch('/api/search/history').then(r => r.json())
    ])
      .then(([statsData, historyData]) => {
        setStats(statsData);
        setHistory(historyData);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-6 lg:p-8 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Bureau of Indian Standards • Procurement Decision Support</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
            AI-Powered Recommendation Engine for Indian Standards (BIS)
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
            Empowering public procurement officers to enter unstructured procurement specifications and receive AI-ranked, explainable Indian Standards with clause-level evidence and compliance insights.
          </p>
          <div className="pt-3 flex flex-wrap gap-3">
            <Link
              to="/find"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md hover:shadow-blue-500/25"
            >
              <Search className="w-4 h-4" />
              <span>Start Procurement Analysis</span>
            </Link>
            <Link
              to="/library"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>Explore Standards Registry</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Indexed Standards</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats?.total_standards || 18}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Active & Synthetic Demo Standards</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Vector Chunks / Clauses</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats?.total_chunks || 54}
          </div>
          <div className="text-[11px] text-slate-500">
            Clause-level RAG embeddings
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Searches Performed</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats?.searches_performed || history.length}
          </div>
          <div className="text-[11px] text-slate-500">
            Procurement specification queries
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">High Relevance (&gt;85%)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats?.high_relevance_matches || 12}
          </div>
          <div className="text-[11px] text-slate-500">
            Highly applicable recommendations
          </div>
        </div>
      </div>

      {/* RAG Workflow Visual Steps */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Procurement RAG Pipeline Architecture
            </h2>
            <p className="text-xs text-slate-500">
              End-to-end transformation from natural language requirement to explainable standards
            </p>
          </div>
          <Link
            to="/settings"
            className="text-xs text-blue-600 font-semibold hover:underline"
          >
            Configure Weights & Scoring →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
              <span>Input Specification</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Procurement tender description in natural language.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
              <span>Entity Extraction</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Identifies product, category, environment, and technical specs.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">3</span>
              <span>Vector Search</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Cosine similarity matching against BIS clauses and scopes.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">4</span>
              <span>Multi-Signal Ranking</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Combines semantic, product, category, and safety weights.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-xs space-y-1">
            <div className="font-bold text-blue-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-700 text-white flex items-center justify-center text-[10px]">5</span>
              <span>Explainable Report</span>
            </div>
            <p className="text-blue-800 text-[11px] leading-relaxed">
              Evidence trace, reason breakdown, PDF/CSV export, and review.
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Standards by Category
            </h2>
            <span className="text-xs text-slate-500">Industry Distribution</span>
          </div>
          <div className="h-64 w-full">
            {stats?.categories_distribution ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.categories_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 30 }}>
                  <XAxis dataKey="category" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Loading chart...</div>
            )}
          </div>
        </div>

        {/* Applicability Classifications */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Recommendation Tiers
            </h2>
            <span className="text-xs text-slate-500">Confidence & Score Distribution</span>
          </div>
          <div className="h-64 w-full">
            {stats?.applicability_distribution ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.applicability_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 30 }}>
                  <XAxis dataKey="type" angle={-30} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Loading chart...</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Searches */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Recent Procurement Queries
            </h2>
            <p className="text-xs text-slate-500">Audit trail of natural language tender searches</p>
          </div>
          <Link
            to="/history"
            className="text-xs text-blue-600 font-semibold hover:underline"
          >
            View Full History →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Procurement Specification</th>
                <th className="p-3.5">Identified Product</th>
                <th className="p-3.5">Top Recommendation</th>
                <th className="p-3.5">Match Score</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {history.length > 0 ? (
                history.slice(0, 5).map((h, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 max-w-xs truncate font-medium text-slate-900">
                      {h.query}
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {h.extracted_requirements?.product || 'Equipment'}
                    </td>
                    <td className="p-3.5 font-mono text-blue-700 font-semibold">
                      {h.top_standard || 'IS 10322'}
                    </td>
                    <td className="p-3.5">
                      <span className="inline-block px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 text-[11px]">
                        {h.top_score}%
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {new Date(h.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-right">
                      <Link
                        to={`/results/${h.id}`}
                        className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                      >
                        Inspect →
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No procurement searches conducted yet. Click "Start Procurement Analysis" above to run your first specification.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
