import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { History, Search, Clock, ArrowRight, FileText, ChevronRight } from 'lucide-react';
import { SearchHistoryItem } from '../types.js';

export function HistoryPage() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/search/history')
      .then(r => r.json())
      .then(d => setHistory(d))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Procurement Search History
          </h1>
          <p className="text-xs text-slate-500">
            Audit log of previously analyzed tender specifications and recommended standards
          </p>
        </div>
        <Link
          to="/find"
          className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors"
        >
          + New Search
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading audit history...</div>
        ) : history.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {history.map(item => (
              <div
                key={item.id}
                className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-mono font-semibold text-slate-700">{item.id.slice(0, 12)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                    <span>•</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-100 font-medium">
                      Mode: {item.ai_mode}
                    </span>
                  </div>

                  <p className="text-xs font-serif text-slate-800 line-clamp-2 leading-relaxed italic">
                    "{item.query}"
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-semibold text-[11px]">
                      Product: {item.extracted_requirements?.product || 'Equipment'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                      Category: {item.extracted_requirements?.category || 'General'}
                    </span>
                    {item.top_standard && (
                      <span className="text-[11px] text-slate-600 font-mono">
                        Top Match: <strong className="text-blue-700">{item.top_standard}</strong> ({item.top_score}%)
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <Link
                    to={`/results/${item.id}`}
                    className="px-4 py-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span>Reopen Report</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-slate-500">
            No search history found yet. Perform a search to see it logged here.
          </div>
        )}
      </div>
    </div>
  );
}
