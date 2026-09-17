import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Sparkles,
  Sliders,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  FileText,
  CheckCircle,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { ExtractedRequirements } from '../types.js';

const SAMPLE_PROMPTS = [
  {
    label: 'LED Street Lighting (Municipal)',
    text: 'Procurement of 500 units of energy efficient 50W outdoor LED street luminaires for municipal roadway illumination. Must withstand extreme outdoor monsoon conditions with IP66 ingress protection rating, surge protection of 10kV, operating at 230V AC, total harmonic distortion under 10%, and minimum rated life of 50,000 burning hours.'
  },
  {
    label: 'Solar PV Modules (Grid Connected)',
    text: 'Supply and installation of 250 kWp ground-mounted crystalline silicon terrestrial photovoltaic (PV) solar modules for government building grid connection. Must operate reliably under high ambient temperature, UV exposure, and satisfy all mechanical load and electrical safety insulation tests.'
  },
  {
    label: 'uPVC Potable Water Pipes',
    text: 'Procurement of 10,000 meters of unplasticized polyvinyl chloride (uPVC) pipes for municipal drinking water supply and distribution network. Pipes must ensure potable non-toxic water conveyance, withstand hydrostatic working pressure of 6 kgf/cm2, and undergo opacity and impact strength testing.'
  },
  {
    label: 'Industrial Safety Helmets',
    text: 'Supply of 2,000 non-metallic industrial protective safety helmets with adjustable chin straps for construction and civil works workers. Helmets must provide cranial shock absorption, penetration resistance, flame resistance, and electrical insulation up to 440V.'
  },
  {
    label: 'Ergonomic Office Chairs',
    text: 'Procurement of 300 units of high-back ergonomic revolving swivel office chairs with pneumatic height adjustment, lumbar support, tilt-lock mechanism, and 5-prong base on twin-wheel nylon castors for administrative workstations.'
  },
  {
    label: 'Fire Extinguishers (ABC Dry Powder)',
    text: 'Supply of 150 numbers of 6kg stored pressure ABC dry chemical powder portable fire extinguishers with discharge hose, pressure gauge, and mounting bracket for commercial office fire protection.'
  }
];

export function FindStandardsPage() {
  const navigate = useNavigate();
  const [specification, setSpecification] = useState('');
  const [showStructured, setShowStructured] = useState(false);
  const [structuredFields, setStructuredFields] = useState<Partial<ExtractedRequirements>>({
    product: '',
    category: '',
    material: '',
    application: '',
    environment: '',
    power: '',
    quantity: ''
  });

  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!specification.trim()) {
      setError('Please enter a procurement specification before running analysis.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Simulate real-time progress steps for high UX feedback
      setStage('Validating specification & terminology...');
      await new Promise(r => setTimeout(r, 250));

      setStage('Extracting structured technical entities (NLP / Gemini)...');
      await new Promise(r => setTimeout(r, 400));

      setStage('Performing semantic vector retrieval against BIS standard chunks...');

      const response = await fetch('/api/recommendations/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specification: specification.trim(),
          structured_fields: showStructured ? structuredFields : undefined
        })
      });

      setStage('Calculating 6-factor multi-signal ranking & applicability...');
      await new Promise(r => setTimeout(r, 300));

      setStage('Grounding evidence clauses & generating report...');

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to complete analysis');
      }

      const result = await response.json();
      // Redirect to the dedicated Results Page
      navigate(`/results/${result.search_id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred during processing.');
      setLoading(false);
    }
  };

  const handleSelectSample = (text: string) => {
    setSpecification(text);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Procurement Decision Support</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Find Applicable Indian Standards
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          Paste any tender requirement, scope of work, or technical item specification. The AI engine parses product attributes, matches BIS standard clauses, and outputs explainable compliance rankings.
        </p>
      </div>

      {/* Main Analysis Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="procurement-spec" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Procurement Specification (Natural Language)</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {specification.length} characters
              </span>
            </div>

            <textarea
              id="procurement-spec"
              rows={6}
              value={specification}
              onChange={e => setSpecification(e.target.value)}
              placeholder="e.g. Supply and delivery of 500 units of energy-efficient 50W outdoor LED street luminaires for municipal roadways. Must withstand extreme outdoor monsoon conditions with IP66 rating, surge protection 10kV, operating at 230V AC, and long service life..."
              className="w-full p-4 text-xs leading-relaxed border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50 hover:bg-white font-sans transition-colors"
              disabled={loading}
            />
          </div>

          {/* 1-Click Sample Prompts */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Or Try A Tested Procurement Sample:
            </div>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PROMPTS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSample(sample.text)}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 hover:border-blue-200 transition-all text-left"
                >
                  ⚡ {sample.label}
                </button>
              ))}
            </div>
          </div>

          {/* Expandable Structured Form */}
          <div className="border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setShowStructured(!showStructured)}
              className="flex items-center justify-between w-full text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors py-1"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                <span>Optional Structured Attributes (For Guided Specification)</span>
              </div>
              {showStructured ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showStructured && (
              <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    placeholder="e.g. LED Roadway Luminaire"
                    value={structuredFields.product}
                    onChange={e => setStructuredFields({ ...structuredFields, product: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={structuredFields.category}
                    onChange={e => setStructuredFields({ ...structuredFields, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="">Auto-Detect from text</option>
                    <option value="Lighting">Lighting</option>
                    <option value="Solar Equipment">Solar Equipment</option>
                    <option value="Electrical Equipment">Electrical Equipment</option>
                    <option value="Water Equipment">Water Equipment</option>
                    <option value="Construction">Construction</option>
                    <option value="Furniture">Furniture</option>
                    <option value="PPE">PPE</option>
                    <option value="IT Equipment">IT Equipment</option>
                    <option value="Fire Safety">Fire Safety</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Application / Usage</label>
                  <input
                    type="text"
                    placeholder="e.g. Public roadway lighting"
                    value={structuredFields.application}
                    onChange={e => setStructuredFields({ ...structuredFields, application: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Operating Environment</label>
                  <input
                    type="text"
                    placeholder="e.g. Outdoor monsoon / coastal"
                    value={structuredFields.environment}
                    onChange={e => setStructuredFields({ ...structuredFields, environment: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Power / Capacity</label>
                  <input
                    type="text"
                    placeholder="e.g. 50W, 230V AC"
                    value={structuredFields.power}
                    onChange={e => setStructuredFields({ ...structuredFields, power: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantity / Scope</label>
                  <input
                    type="text"
                    placeholder="e.g. 500 units"
                    value={structuredFields.quantity}
                    onChange={e => setStructuredFields({ ...structuredFields, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !specification.trim()}
              className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{stage || 'Analyzing Specification...'}</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Analyze Specification & Recommend Standards</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Live Multi-stage progress indicator when loading */}
        {loading && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-800">
              <span className="flex items-center gap-2 text-blue-600">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>RAG Retrieval & Scoring in Progress</span>
              </span>
              <span className="text-[11px] text-slate-400">Step 3 of 5</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div className="bg-blue-600 h-1.5 rounded-full animate-pulse w-3/4"></div>
            </div>
            <div className="text-[11px] text-slate-500 italic">
              {stage}
            </div>
          </div>
        )}
      </div>

      {/* Info notice card */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
        <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-slate-800">Multi-Signal Re-Ranking Guarantee</div>
          <p className="leading-relaxed">
            Recommendations are ranked by a weighted combination of dense vector semantic similarity (40%), direct product match (20%), category discipline (15%), operational application (10%), technical specifications (10%), and safety testing standards (5%).
          </p>
        </div>
      </div>
    </div>
  );
}
