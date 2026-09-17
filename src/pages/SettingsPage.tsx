import React, { useState, useEffect } from 'react';
import { Settings, Sliders, CheckCircle, RefreshCw, Cpu, Sparkles, Database, ShieldAlert } from 'lucide-react';
import { RankingWeights } from '../types.js';
import { useAuth } from '../context/AuthContext.js';

export function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [weights, setWeights] = useState<RankingWeights>({
    semantic_weight: 0.40,
    product_weight: 0.20,
    category_weight: 0.15,
    application_weight: 0.10,
    technical_weight: 0.10,
    safety_weight: 0.05,
    top_k: 10
  });

  const [configInfo, setConfigInfo] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(data => {
        if (data.weights) setWeights(data.weights);
        setConfigInfo(data);
      })
      .catch(e => console.error(e));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      const res = await fetch('/api/config/weights', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(weights)
      });
      if (res.ok) {
        setSuccessMsg('Re-ranking weights updated and applied across recommendation engine!');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save weights');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setWeights({
      semantic_weight: 0.40,
      product_weight: 0.20,
      category_weight: 0.15,
      application_weight: 0.10,
      technical_weight: 0.10,
      safety_weight: 0.05,
      top_k: 10
    });
  };

  const totalWeight = (
    (weights.semantic_weight || 0) +
    (weights.product_weight || 0) +
    (weights.category_weight || 0) +
    (weights.application_weight || 0) +
    (weights.technical_weight || 0) +
    (weights.safety_weight || 0)
  ).toFixed(2);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Model & Ranking Configuration
        </h1>
        <p className="text-xs text-slate-500">
          Adjust multi-signal weights for the RAG scoring algorithm and view AI system diagnostics
        </p>
      </div>

      {/* Weights Tuning Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Multi-Signal Re-Ranking Weights</span>
            </h2>
            <p className="text-xs text-slate-500">
              Weights must total ~1.00 (Current Sum: <strong className={parseFloat(totalWeight) === 1.0 ? 'text-emerald-600' : 'text-amber-600'}>{totalWeight}</strong>)
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            Reset to BIS Defaults
          </button>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          {/* Sliders */}
          <div className="space-y-4">
            {/* Semantic Vector */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-800">
                  Dense Semantic Vector Similarity (Cosine Similarity)
                </span>
                <span className="font-mono font-bold text-blue-600">
                  {Math.round(weights.semantic_weight * 100)}% ({weights.semantic_weight})
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights.semantic_weight}
                onChange={e => setWeights({ ...weights, semantic_weight: parseFloat(e.target.value) })}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Product Match */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-800">Product Entity Match</span>
                <span className="font-mono font-bold text-blue-600">
                  {Math.round(weights.product_weight * 100)}% ({weights.product_weight})
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights.product_weight}
                onChange={e => setWeights({ ...weights, product_weight: parseFloat(e.target.value) })}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Category Match */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-800">Category Discipline Match</span>
                <span className="font-mono font-bold text-blue-600">
                  {Math.round(weights.category_weight * 100)}% ({weights.category_weight})
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights.category_weight}
                onChange={e => setWeights({ ...weights, category_weight: parseFloat(e.target.value) })}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Application Match */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-800">Operational Application / Environment Match</span>
                <span className="font-mono font-bold text-blue-600">
                  {Math.round(weights.application_weight * 100)}% ({weights.application_weight})
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights.application_weight}
                onChange={e => setWeights({ ...weights, application_weight: parseFloat(e.target.value) })}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Technical Match */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-800">Technical Requirement Match</span>
                <span className="font-mono font-bold text-blue-600">
                  {Math.round(weights.technical_weight * 100)}% ({weights.technical_weight})
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights.technical_weight}
                onChange={e => setWeights({ ...weights, technical_weight: parseFloat(e.target.value) })}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Safety Match */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-800">Safety & Testing Standards Match</span>
                <span className="font-mono font-bold text-blue-600">
                  {Math.round(weights.safety_weight * 100)}% ({weights.safety_weight})
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights.safety_weight}
                onChange={e => setWeights({ ...weights, safety_weight: parseFloat(e.target.value) })}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Top K */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Top Candidates to Retrieve (Top K)
              </label>
              <select
                value={weights.top_k}
                onChange={e => setWeights({ ...weights, top_k: parseInt(e.target.value, 10) })}
                className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white"
              >
                <option value="5">Top 5 Candidates</option>
                <option value="10">Top 10 Candidates (Default)</option>
                <option value="15">Top 15 Candidates</option>
                <option value="20">Top 20 Candidates</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              {saving ? 'Saving...' : 'Apply & Save Scoring Weights'}
            </button>
          </div>
        </form>
      </div>

      {/* Diagnostics Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-600" />
          <span>AI Pipeline Diagnostics & Environment</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">LLM Reasoning Engine</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-800 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>{configInfo?.llm_model || 'gemini-3.8-flash'}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Status: {configInfo?.has_gemini_key ? 'Active (Cloud GenAI)' : 'Fallback Local NLP Active'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Embedding Model</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-800 mt-0.5">
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              <span>{configInfo?.embedding_model || 'sentence-transformers/all-MiniLM-L6-v2'}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Vector Dimensions: 256-d Dense Semantic Projection
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
