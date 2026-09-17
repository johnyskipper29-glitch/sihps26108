import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Layers, Filter, Eye, Tag, CheckCircle2 } from 'lucide-react';
import { Standard } from '../types.js';
import { StandardDetailModal } from '../components/StandardDetailModal.js';

export function StandardsLibraryPage() {
  const [standards, setStandards] = useState<Standard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStandardId, setSelectedStandardId] = useState<string | null>(null);

  useEffect(() => {
    fetchStandards();
  }, [selectedCategory]);

  const fetchStandards = () => {
    setLoading(true);
    let url = '/api/standards';
    if (selectedCategory !== 'ALL') {
      url += `?category=${encodeURIComponent(selectedCategory)}`;
    }
    fetch(url)
      .then(r => r.json())
      .then(d => setStandards(d))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  };

  const categories = [
    'ALL',
    'Lighting',
    'Solar Equipment',
    'Electrical Equipment',
    'Water Equipment',
    'Construction',
    'PPE',
    'Furniture',
    'IT Equipment',
    'Fire Safety'
  ];

  const filteredStandards = standards.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.is_number.toLowerCase().includes(q) ||
      s.title.toLowerCase().includes(q) ||
      s.scope.toLowerCase().includes(q) ||
      s.keywords.some(k => k.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Indian Standards Registry (BIS Repository)
          </h1>
          <p className="text-xs text-slate-500">
            Browse and inspect indexed standards, clause-level chunks, and technical testing protocols
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
          {filteredStandards.length} Standards Available
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by IS number (e.g. IS 10322), title, or keywords..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 font-medium"
            >
              {categories.map(c => (
                <option key={c} value={c}>
                  {c === 'ALL' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Category Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === c
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {c === 'ALL' ? 'All' : c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Standards */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500">Loading standards catalog...</div>
      ) : filteredStandards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStandards.map(s => (
            <div
              key={s.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {s.is_number}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {s.category}
                    </span>
                    {s.is_demo && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                        DEMO
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 line-clamp-2">
                  {s.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed font-serif">
                  {s.scope}
                </p>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>{s.chunks_count || 3} Indexed Clauses</span>
                  <span>Rev. {s.revision}</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {s.keywords.slice(0, 3).map((kw, i) => (
                    <span key={i} className="text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                      #{kw}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => setSelectedStandardId(s.id)}
                  className="w-full py-2 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Full Specification & Clauses</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
          No standards match your filter criteria.
        </div>
      )}

      {/* Modal */}
      <StandardDetailModal
        standardId={selectedStandardId}
        onClose={() => setSelectedStandardId(null)}
      />
    </div>
  );
}
