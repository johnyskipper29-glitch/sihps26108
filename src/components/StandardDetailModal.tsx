import React, { useState, useEffect } from 'react';
import { X, BookOpen, Layers, CheckCircle2, FileText, Tag, Calendar, Building } from 'lucide-react';
import { Standard, StandardChunk } from '../types.js';

interface StandardDetailModalProps {
  standardId: string | null;
  onClose: () => void;
}

export function StandardDetailModal({ standardId, onClose }: StandardDetailModalProps) {
  const [standard, setStandard] = useState<(Standard & { chunks?: StandardChunk[] }) | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!standardId) {
      setStandard(null);
      return;
    }
    setLoading(true);
    fetch(`/api/standards/${encodeURIComponent(standardId)}`)
      .then(res => res.json())
      .then(data => {
        setStandard(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [standardId]);

  if (!standardId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
              BIS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-blue-700">{standard?.is_number}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800">
                  {standard?.status}
                </span>
                {standard?.is_demo && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-100 text-amber-800">
                    DEMO DATA
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-slate-900 line-clamp-1">{standard?.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {loading ? (
            <div className="py-12 text-center text-slate-500">Loading standard metadata & clauses...</div>
          ) : standard ? (
            <>
              {/* Meta pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[11px]">Category:</span>
                  <span className="font-bold text-slate-900">{standard.category}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Edition / Revision:</span>
                  <span className="font-bold text-slate-900">{standard.revision}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Source Reference:</span>
                  <span className="font-bold text-slate-900">{standard.source_reference}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Document:</span>
                  <span className="font-bold text-slate-900 line-clamp-1">{standard.document_name}</span>
                </div>
              </div>

              {/* Scope */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Official Scope & Field of Application
                </h3>
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs leading-relaxed font-serif">
                  {standard.scope}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Technical Summary
                </h3>
                <p className="text-slate-700 leading-relaxed">{standard.description}</p>
              </div>

              {/* Keywords */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Indexed Keywords & Domain Synonyms
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {standard.keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md border border-slate-200 font-mono text-[11px]"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Chunks / Clauses */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                  <span>Indexed Clauses ({standard.chunks?.length || 0})</span>
                  <span className="text-[11px] font-normal text-slate-400">RAG Vector Chunks</span>
                </h3>

                <div className="space-y-2.5">
                  {(standard.chunks || []).map((c, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold text-slate-700">
                        <span className="text-blue-700">{c.section}</span>
                        <span className="text-slate-400 text-[11px]">Page {c.page_number}</span>
                      </div>
                      <div className="text-slate-600 font-mono text-[11px] leading-relaxed">
                        {c.chunk_text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-slate-500">Standard not found.</div>
          )}
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
