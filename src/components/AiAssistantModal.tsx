import React, { useState } from 'react';
import { X, Sparkles, Send, ShieldAlert, Bot, User, CheckCircle2 } from 'lucide-react';
import { Standard } from '../types.js';

interface AiAssistantModalProps {
  searchId: string;
  standard: Standard | null;
  onClose: () => void;
}

export function AiAssistantModal({ searchId, standard, onClose }: AiAssistantModalProps) {
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState<Array<{ sender: 'user' | 'assistant'; text: string; source?: string }>>([
    {
      sender: 'assistant',
      text: standard
        ? `Hello! I am your Technical Compliance Assistant. You can ask me specific questions regarding why standard ${standard.is_number} was recommended, what clauses apply to your tender specification, or what testing methods are mandated.`
        : 'Hello! I am your Technical Compliance Assistant. Ask me any technical clarification about your procurement recommendations.'
    }
  ]);
  const [loading, setLoading] = useState(false);

  const ask = async (qText?: string) => {
    const textToSend = qText || question;
    if (!textToSend.trim() || loading) return;

    const userMsg = textToSend.trim();
    setConversation(prev => [...prev, { sender: 'user', text: userMsg }]);
    setQuestion('');
    setLoading(true);

    try {
      const res = await fetch('/api/recommendations/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMsg,
          search_id: searchId,
          standard_id: standard?.id
        })
      });
      const data = await res.json();
      setConversation(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: data.answer || 'No specific clause match found.',
          source: data.evidence_source
        }
      ]);
    } catch (err) {
      setConversation(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Unable to communicate with assistant. Please verify network connection.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    `Why is ${standard?.is_number || 'this standard'} recommended for my specification?`,
    `What are the key safety and testing requirements mandated?`,
    `Does this standard cover outdoor extreme environmental conditions?`,
    `What certification or marking is required from the manufacturer?`
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full h-[600px] max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Evidence-Grounded Assistant
              </h2>
              <div className="text-[11px] text-slate-500">
                {standard ? `Grounded in clauses from ${standard.is_number} (${standard.title})` : 'Contextual Recommendation Support'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Disclaimer line */}
        <div className="bg-amber-50 px-4 py-1.5 border-b border-amber-100 flex items-center gap-1.5 text-[11px] text-amber-800">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          <span>Strict No-Hallucination Policy: Answers are grounded exclusively on verified standard clauses.</span>
        </div>

        {/* Chat History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
          {conversation.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white font-medium'
                    : 'bg-white border border-slate-200 text-slate-800 shadow-xs'
                }`}
              >
                <div>{msg.text}</div>
                {msg.source && (
                  <div className="mt-1.5 pt-1 border-t border-slate-100 text-[10px] text-blue-600 font-mono">
                    Clause: {msg.source}
                  </div>
                )}
              </div>
              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5 items-center text-xs text-slate-500 py-1">
              <Bot className="w-4 h-4 text-blue-500 animate-pulse" />
              <span>Analyzing retrieved clauses and verifying against tender requirements...</span>
            </div>
          )}
        </div>

        {/* Suggested chips */}
        <div className="px-4 py-2 border-t border-slate-100 bg-white flex flex-wrap gap-1.5">
          {samplePrompts.slice(0, 2).map((sp, idx) => (
            <button
              key={idx}
              onClick={() => ask(sp)}
              className="text-[11px] text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-2.5 py-1 rounded-full border border-slate-200 transition-colors text-left"
            >
              "{sp}"
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
          <input
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && ask()}
            placeholder="Ask a technical or compliance question regarding this standard..."
            className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => ask()}
            disabled={!question.trim() || loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Ask</span>
          </button>
        </div>
      </div>
    </div>
  );
}
