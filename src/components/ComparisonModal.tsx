import React, { useState, useEffect } from 'react';
import { X, Check, Columns, ArrowRight, ShieldCheck } from 'lucide-react';

interface ComparisonModalProps {
  standardIds: string[];
  onClose: () => void;
}

export function ComparisonModal({ standardIds, onClose }: ComparisonModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!standardIds || standardIds.length < 2) return;
    setLoading(true);
    fetch('/api/recommendations/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ standard_ids: standardIds })
    })
      .then(r => r.json())
      .then(d => setData(d))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, [standardIds]);

  if (standardIds.length < 2) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Columns className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Standards Side-by-Side Comparison
              </h2>
              <p className="text-xs text-slate-500">
                Evaluating {standardIds.length} standards against technical scope, clauses, and application suitability
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">Generating comparison matrix...</div>
          ) : data && data.standards ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="p-3 border border-slate-200 font-bold text-slate-700 w-1/4">
                      Specification Attribute
                    </th>
                    {data.standards.map((s: any, idx: number) => (
                      <th key={idx} className="p-3 border border-slate-200 font-bold text-slate-900 bg-blue-50/50">
                        <div className="text-blue-700 font-mono text-sm">{s.is_number}</div>
                        <div className="text-[11px] font-normal text-slate-600 mt-0.5 line-clamp-2">{s.title}</div>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded bg-slate-200 text-[10px] font-medium text-slate-700">
                          {s.category}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.attributes.map((attr: any, i: number) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="p-3 border border-slate-200 font-semibold text-slate-700 align-top">
                        {attr.name}
                      </td>
                      {attr.values.map((val: string, j: number) => (
                        <td key={j} className="p-3 border border-slate-200 text-slate-800 align-top leading-relaxed">
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-xs">Could not load comparison data.</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
