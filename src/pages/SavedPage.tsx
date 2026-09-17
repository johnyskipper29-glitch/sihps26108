import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, CheckCircle, ExternalLink, Trash2, ArrowRight } from 'lucide-react';
import { Recommendation } from '../types.js';

export function SavedPage() {
  const [saved, setSaved] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSaved();
  }, []);

  const fetchSaved = () => {
    setLoading(true);
    fetch('/api/recommendations/saved/all')
      .then(r => r.json())
      .then(d => setSaved(d))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  };

  const removeBookmark = async (recId: string) => {
    try {
      await fetch(`/api/recommendations/${recId}/save`, { method: 'POST' });
      setSaved(prev => prev.filter(r => r.id !== recId));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Saved Recommendations
        </h1>
        <p className="text-xs text-slate-500">
          Bookmarked Indian Standards flagged for tender integration or procurement review
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading saved recommendations...</div>
        ) : saved.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {saved.map(rec => {
              const std = rec.standard;
              return (
                <div
                  key={rec.id}
                  className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-blue-700 font-mono text-sm">
                        {std?.is_number || rec.standard_id}
                      </span>
                      <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 text-[11px]">
                        {rec.relevance_score}% Relevance
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                        {rec.applicability_type.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">{std?.title}</h3>

                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {rec.reason}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/results/${rec.search_id}`}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span>View Tender Search</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      onClick={() => removeBookmark(rec.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove Bookmark"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-slate-500">
            No saved recommendations. Click the bookmark icon on any recommendation in the search results to pin it here.
          </div>
        )}
      </div>
    </div>
  );
}
