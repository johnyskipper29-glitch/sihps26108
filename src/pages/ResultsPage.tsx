import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  FileSpreadsheet,
  Share2,
  Check,
  X,
  Bookmark,
  Sparkles,
  Columns,
  Eye,
  Info,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  Copy,
  Layers,
  FileText
} from 'lucide-react';
import { Recommendation, SearchHistoryItem, Standard } from '../types.js';
import { EvidenceModal } from '../components/EvidenceModal.js';
import { StandardDetailModal } from '../components/StandardDetailModal.js';
import { ComparisonModal } from '../components/ComparisonModal.js';
import { AiAssistantModal } from '../components/AiAssistantModal.js';

export function ResultsPage() {
  const { searchId } = useParams<{ searchId: string }>();
  const [search, setSearch] = useState<SearchHistoryItem | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [selectedEvidenceRec, setSelectedEvidenceRec] = useState<Recommendation | null>(null);
  const [selectedStandardId, setSelectedStandardId] = useState<string | null>(null);
  const [assistantStandard, setAssistantStandard] = useState<Standard | null>(null);
  const [showAssistant, setShowAssistant] = useState(false);

  // Compare multi-selection
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Copy feedback
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!searchId) return;
    setLoading(true);
    fetch(`/api/recommendations/${searchId}`)
      .then(res => {
        if (!res.ok) throw new Error('Search result not found');
        return res.json();
      })
      .then(data => {
        setSearch(data.search);
        setRecommendations(data.recommendations || []);
      })
      .catch(err => {
        console.error(err);
        setError(err.message || 'Could not retrieve recommendation results.');
      })
      .finally(() => setLoading(false));
  }, [searchId]);

  // Review Status Handler
  const handleReview = async (recId: string, status: 'PENDING_REVIEW' | 'ACCEPTED' | 'REJECTED') => {
    try {
      const res = await fetch(`/api/recommendations/${recId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setRecommendations(prev =>
          prev.map(r => (r.id === recId ? { ...r, review_status: status } : r))
        );
      }
    } catch (err) {
      console.error('Review update failed:', err);
    }
  };

  // Toggle Bookmark Handler
  const handleToggleSave = async (recId: string) => {
    try {
      const res = await fetch(`/api/recommendations/${recId}/save`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendations(prev =>
          prev.map(r => (r.id === recId ? { ...r, is_saved: data.is_saved } : r))
        );
      }
    } catch (err) {
      console.error('Save toggle failed:', err);
    }
  };

  // Toggle selection for comparison
  const toggleCompare = (stdId: string) => {
    if (selectedForCompare.includes(stdId)) {
      setSelectedForCompare(selectedForCompare.filter(id => id !== stdId));
    } else {
      if (selectedForCompare.length >= 4) {
        alert('You can compare a maximum of 4 standards simultaneously.');
        return;
      }
      setSelectedForCompare([...selectedForCompare, stdId]);
    }
  };

  const handleCopySummary = () => {
    if (!search || recommendations.length === 0) return;
    const text = `Procurement Analysis Report: ${search.query}\n\nTop Recommended Standards:\n` +
      recommendations.map((r, i) => `${i + 1}. ${r.standard?.is_number}: ${r.standard?.title} (${r.relevance_score}% Relevance)`).join('\n') +
      '\n\nAI Mode: ' + search.ai_mode + ' | BIS Decision Support System';
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <div className="text-sm font-semibold text-slate-700">Loading analysis & recommendations...</div>
      </div>
    );
  }

  if (error || !search) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Analysis Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'The requested analysis ID does not exist.'}</p>
        <Link
          to="/find"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
        >
          Return to Find Standards
        </Link>
      </div>
    );
  }

  const ext = search.extracted_requirements;

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Top Header & Actions Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                REPORT ID: {search.id.slice(0, 12)}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{search.processing_time_ms} ms</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                • Mode: {search.ai_mode}
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">
              Procurement Standards Analysis & Ranking
            </h1>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <a
              href={`/api/reports/${search.id}/csv`}
              download
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </a>

            <a
              href={`/api/reports/${search.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Print / Download PDF</span>
            </a>
          </div>
        </div>

        {/* Specification Text Block */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
          <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">
            Submitted Procurement Specification:
          </div>
          <div className="font-serif text-slate-800 leading-relaxed italic">
            "{search.query}"
          </div>
        </div>
      </div>

      {/* Extracted Requirements Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Extracted Technical Requirements (Structured Profile)</span>
          </h2>
          <span className="text-[11px] text-slate-400">
            Automated entity parsing via {search.ai_mode === 'AI' ? 'Gemini NLP' : 'Deterministic Rule-Based NLP'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 bg-slate-50 rounded-lg">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Identified Product</span>
            <span className="font-bold text-slate-800">{ext.product || 'Equipment'}</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
            <span className="font-bold text-slate-800">{ext.category || 'General'}</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Environment</span>
            <span className="font-bold text-slate-800">{ext.environment || 'Standard'}</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Application</span>
            <span className="font-bold text-slate-800">{ext.application || 'Standard'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
          <div className="p-2.5 bg-slate-50 rounded-lg space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Technical Specifications</span>
            <div className="flex flex-wrap gap-1">
              {(ext.technical_specifications || []).map((t, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-[11px]">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Safety & Testing Standards</span>
            <div className="flex flex-wrap gap-1">
              {(ext.safety_requirements || []).map((s, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-[11px]">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Compare Floating Bar (When 2+ selected) */}
      {selectedForCompare.length >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 text-xs">
          <div>
            <span className="font-bold">{selectedForCompare.length} Standards Selected</span> for comparison
          </div>
          <button
            onClick={() => setShowCompareModal(true)}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-colors"
          >
            Compare Side-by-Side →
          </button>
          <button
            onClick={() => setSelectedForCompare([])}
            className="text-slate-400 hover:text-white"
          >
            Clear
          </button>
        </div>
      )}

      {/* Recommended Standards List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Applicable Indian Standards ({recommendations.length} Found)
            </h2>
            <p className="text-xs text-slate-500">
              Ranked using semantic vector similarity and 6-factor procurement alignment
            </p>
          </div>
          {selectedForCompare.length > 0 && (
            <span className="text-xs text-blue-600 font-semibold">
              {selectedForCompare.length} selected for comparison
            </span>
          )}
        </div>

        {recommendations.map((rec, index) => {
          const std = rec.standard;
          const isHighly = rec.applicability_type === 'HIGHLY_APPLICABLE';
          const isStrong = rec.applicability_type === 'STRONG_CANDIDATE';

          return (
            <div
              key={rec.id}
              className={`bg-white rounded-2xl border transition-all p-6 shadow-xs space-y-4 ${
                isHighly
                  ? 'border-emerald-300 ring-1 ring-emerald-200/50'
                  : isStrong
                  ? 'border-blue-200'
                  : 'border-slate-200'
              }`}
            >
              {/* Card Top: Standard title, Rank, Score, and Badges */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {/* Compare checkbox */}
                  <input
                    type="checkbox"
                    checked={std ? selectedForCompare.includes(std.id) : false}
                    onChange={() => std && toggleCompare(std.id)}
                    className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                    title="Select to compare side-by-side"
                  />

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        RANK #{index + 1}
                      </span>
                      <button
                        onClick={() => setSelectedStandardId(std?.id || null)}
                        className="text-base font-black text-blue-700 hover:underline tracking-tight text-left"
                      >
                        {std?.is_number || rec.standard_id}
                      </button>
                      <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-600">
                        {std?.category}
                      </span>
                      {std?.is_demo && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-100 text-amber-800">
                          DEMO DATA
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">
                      {std?.title}
                    </h3>
                  </div>
                </div>

                {/* Score & Applicability Badge */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-2xl font-black text-slate-900 leading-tight">
                      {rec.relevance_score}%
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">
                      Relevance Score (Conf. {rec.confidence_score})
                    </div>
                  </div>

                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                      isHighly
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : isStrong
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {rec.applicability_type.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Progress bar visual */}
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full ${
                    isHighly ? 'bg-emerald-500' : isStrong ? 'bg-blue-600' : 'bg-amber-500'
                  }`}
                  style={{ width: `${rec.relevance_score}%` }}
                ></div>
              </div>

              {/* Applicability Conditions (if any) */}
              {rec.conditions && rec.conditions.length > 0 && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold">Applicability Condition:</span>
                    {rec.conditions.map((c, i) => (
                      <div key={i}>{c}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Why Recommended: Reason Breakdown */}
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-blue-700">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Why Recommended (Explainability Trace)</span>
                </div>
                <p className="text-slate-700 leading-relaxed font-medium">
                  {rec.reason}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {rec.reasons_breakdown.map((r, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Matched Requirements Chips */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Aligned Tender Specifications:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {rec.matched_requirements.map((m, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      ✓ {m}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer Actions: Evidence button, Review status, Save, Chat */}
              <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Supporting evidence & standard preview */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedEvidenceRec(rec)}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Supporting Evidence ({rec.evidence?.length || 1} Chunks)</span>
                  </button>

                  <button
                    onClick={() => {
                      setAssistantStandard(std || null);
                      setShowAssistant(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ask AI About This Standard</span>
                  </button>
                </div>

                {/* Human in the loop review and bookmark */}
                <div className="flex items-center gap-2">
                  {/* Review Status controls */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                    <button
                      onClick={() => handleReview(rec.id, 'ACCEPTED')}
                      className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
                        rec.review_status === 'ACCEPTED'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-emerald-700'
                      }`}
                      title="Mark standard as accepted for this procurement"
                    >
                      <Check className="w-3 h-3" />
                      <span>Accept</span>
                    </button>

                    <button
                      onClick={() => handleReview(rec.id, 'REJECTED')}
                      className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
                        rec.review_status === 'REJECTED'
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-red-700'
                      }`}
                      title="Mark standard as rejected / not applicable"
                    >
                      <X className="w-3 h-3" />
                      <span>Reject</span>
                    </button>
                  </div>

                  {/* Bookmark button */}
                  <button
                    onClick={() => handleToggleSave(rec.id)}
                    className={`p-2 rounded-lg border transition-colors ${
                      rec.is_saved
                        ? 'bg-amber-50 text-amber-600 border-amber-300'
                        : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600'
                    }`}
                    title={rec.is_saved ? 'Remove Bookmark' : 'Bookmark Recommendation'}
                  >
                    <Bookmark className="w-4 h-4 fill-current" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <EvidenceModal
        recommendation={selectedEvidenceRec}
        onClose={() => setSelectedEvidenceRec(null)}
      />

      <StandardDetailModal
        standardId={selectedStandardId}
        onClose={() => setSelectedStandardId(null)}
      />

      {showCompareModal && (
        <ComparisonModal
          standardIds={selectedForCompare}
          onClose={() => setShowCompareModal(false)}
        />
      )}

      {showAssistant && (
        <AiAssistantModal
          searchId={search.id}
          standard={assistantStandard}
          onClose={() => setShowAssistant(false)}
        />
      )}
    </div>
  );
}
