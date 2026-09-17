import React from 'react';
import { X, FileText, CheckCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { Recommendation } from '../types.js';

interface EvidenceModalProps {
  recommendation: Recommendation | null;
  onClose: () => void;
}

export function EvidenceModal({ recommendation, onClose }: EvidenceModalProps) {
  if (!recommendation) return null;
  const { standard, evidence, score_breakdown, matched_requirements } = recommendation;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Traceable Supporting Evidence
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              {standard?.is_number}: {standard?.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Signal Match Summary */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4">
            <div className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Multi-Signal Alignment Breakdown</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-white p-2 rounded-lg border border-blue-100">
                <span className="text-slate-500 block">Semantic Vector:</span>
                <span className="text-slate-900 font-bold">{score_breakdown.semantic}%</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-blue-100">
                <span className="text-slate-500 block">Product Match:</span>
                <span className="text-slate-900 font-bold">{score_breakdown.product}%</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-blue-100">
                <span className="text-slate-500 block">Category Match:</span>
                <span className="text-slate-900 font-bold">{score_breakdown.category}%</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-blue-100">
                <span className="text-slate-500 block">Application Match:</span>
                <span className="text-slate-900 font-bold">{score_breakdown.application}%</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-blue-100">
                <span className="text-slate-500 block">Technical Spec:</span>
                <span className="text-slate-900 font-bold">{score_breakdown.technical}%</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-blue-100">
                <span className="text-slate-500 block">Safety Testing:</span>
                <span className="text-slate-900 font-bold">{score_breakdown.safety}%</span>
              </div>
            </div>
          </div>

          {/* Extracted Requirements Matched */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">Matched Requirements from Tender</h3>
            <div className="flex flex-wrap gap-1.5">
              {matched_requirements.map((req, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
                >
                  <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>{req}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Evidence Snippets */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              Retrieved Standard Document Chunks ({evidence.length})
            </h3>
            <div className="space-y-3">
              {evidence.map((ev, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-2">
                  <div className="flex items-center justify-between font-semibold text-slate-700">
                    <div className="flex items-center gap-1.5 text-blue-700">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{ev.document}</span>
                    </div>
                    <div className="text-slate-500">
                      Page {ev.page} • {ev.section}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-[12px] text-slate-800 leading-relaxed">
                    "{ev.snippet}"
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Close Evidence Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
