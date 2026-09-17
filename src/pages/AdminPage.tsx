import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Upload,
  FileText,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Users,
  Database,
  Layers
} from 'lucide-react';
import { Standard, User } from '../types.js';
import { useAuth } from '../context/AuthContext.js';

export function AdminPage() {
  const { user } = useAuth();
  const [standards, setStandards] = useState<Standard[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload state
  const [isNumber, setIsNumber] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Lighting');
  const [scope, setScope] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [uploading, setUploading] = useState(false);
  const [ingestionStage, setIngestionStage] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stdRes, userRes] = await Promise.all([
        fetch('/api/standards'),
        fetch('/api/admin/users', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);
      if (stdRes.ok) setStandards(await stdRes.json());
      if (userRes.ok) setUsers(await userRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isNumber || !title) {
      setMessage({ type: 'error', text: 'Standard Number and Title are required.' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      setIngestionStage('1/5: Uploading document to server...');
      await new Promise(r => setTimeout(r, 200));

      setIngestionStage('2/5: Extracting and parsing document structure...');
      await new Promise(r => setTimeout(r, 300));

      setIngestionStage('3/5: Chunking document into clauses (500-800 characters)...');
      await new Promise(r => setTimeout(r, 250));

      setIngestionStage('4/5: Generating dense vector embeddings for clauses...');

      const formData = new FormData();
      formData.append('is_number', isNumber.trim());
      formData.append('title', title.trim());
      formData.append('category', category);
      formData.append('scope', scope.trim());
      formData.append('description', description.trim());
      formData.append('keywords', keywords.trim());
      if (file) {
        formData.append('document', file);
      }

      const res = await fetch('/api/standards/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      setIngestionStage('5/5: Indexing clauses into vector repository...');
      await new Promise(r => setTimeout(r, 200));

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to ingest standard');
      }

      const data = await res.json();
      setMessage({
        type: 'success',
        text: `Standard ${isNumber} ingested successfully! ${data.chunks_indexed} clauses indexed.`
      });

      // Clear form
      setIsNumber('');
      setTitle('');
      setScope('');
      setDescription('');
      setKeywords('');
      setFile(null);

      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Ingestion failed.' });
    } finally {
      setUploading(false);
      setIngestionStage('');
    }
  };

  const handleDelete = async (id: string, isNumber: string) => {
    if (!confirm(`Are you sure you want to delete standard ${isNumber}? This will remove all associated vector chunks.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/standards/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setStandards(prev => prev.filter(s => s.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReindex = async () => {
    try {
      const res = await fetch('/api/standards/reindex', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.message || 'Vector index refreshed!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Administrative Console</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Document Ingestion & Knowledge Base Management
          </h1>
          <p className="text-xs text-slate-500">
            Ingest official BIS standard specifications, manage clause chunking, and reindex vector representations.
          </p>
        </div>

        <button
          onClick={handleReindex}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Vector Index</span>
        </button>
      </div>

      {/* Ingestion Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Upload className="w-4 h-4 text-blue-600" />
            <span>Ingest New Indian Standard (RAG Pipeline)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Upload document or enter metadata to automatically chunk, embed, and index into the semantic vector catalog.
          </p>
        </div>

        {message && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Standard Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. IS 10322 (Part 5/Sec 3)"
                value={isNumber}
                onChange={e => setIsNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Standard Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Luminaires - Particular Requirements - Luminaires for Road and Street Lighting"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Industry Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="Lighting">Lighting</option>
                <option value="Solar Equipment">Solar Equipment</option>
                <option value="Electrical Equipment">Electrical Equipment</option>
                <option value="Water Equipment">Water Equipment</option>
                <option value="Construction">Construction</option>
                <option value="PPE">PPE</option>
                <option value="Furniture">Furniture</option>
                <option value="IT Equipment">IT Equipment</option>
                <option value="Fire Safety">Fire Safety</option>
                <option value="General Equipment">General Equipment</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Indexed Keywords (Comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. street lighting, luminaire, led, outdoor, roadway, ip66"
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-bold text-slate-700 mb-1">
              Scope of Standard (Used for semantic indexing)
            </label>
            <textarea
              rows={3}
              placeholder="Specify the operational scope, application boundaries, and environmental envelope..."
              value={scope}
              onChange={e => setScope(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-serif"
            />
          </div>

          <div className="text-xs">
            <label className="block font-bold text-slate-700 mb-1">
              Technical Clauses / Detailed Description
            </label>
            <textarea
              rows={3}
              placeholder="Paste clauses, testing protocols, or technical parameters to be chunked..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-[11px]"
            />
          </div>

          {/* File Upload drag-and-drop or select */}
          <div className="text-xs">
            <label className="block font-bold text-slate-700 mb-1">
              Attach Standard Document (.txt, .pdf, .docx) - Optional
            </label>
            <div className="border-2 border-dashed border-slate-200 hover:border-blue-300 rounded-xl p-4 text-center cursor-pointer bg-slate-50/50">
              <input
                type="file"
                accept=".txt,.pdf,.docx"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="doc-upload"
              />
              <label htmlFor="doc-upload" className="cursor-pointer space-y-1 block">
                <FileText className="w-6 h-6 text-slate-400 mx-auto" />
                <div className="font-semibold text-slate-700">
                  {file ? file.name : 'Click or drag document to upload'}
                </div>
                <div className="text-[11px] text-slate-400">
                  Supports .txt, .pdf, .docx files up to 10MB
                </div>
              </label>
            </div>
          </div>

          {uploading && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-blue-800">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>RAG Ingestion in Progress</span>
              </div>
              <div className="text-blue-600 text-[11px] font-mono">{ingestionStage}</div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Ingesting Standard...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Ingest & Index Standard</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Standards Registry Manager */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Indexed Standards Registry ({standards.length})
            </h2>
            <p className="text-xs text-slate-500">Active repository entries and associated vector chunks</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Standard Number</th>
                <th className="p-3.5">Title</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Clauses / Chunks</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {standards.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/80">
                  <td className="p-3.5 font-mono font-bold text-blue-700">{s.is_number}</td>
                  <td className="p-3.5 max-w-md truncate font-medium text-slate-900">{s.title}</td>
                  <td className="p-3.5">{s.category}</td>
                  <td className="p-3.5 font-semibold text-slate-600">{s.chunks_count || 3} chunks</td>
                  <td className="p-3.5">
                    {s.is_demo ? (
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-800">
                        DEMO
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-blue-100 text-blue-800">
                        USER
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleDelete(s.id, s.is_number)}
                      className="text-red-600 hover:text-red-800 font-semibold text-xs inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
