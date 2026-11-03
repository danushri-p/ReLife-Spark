import React, { useState } from 'react';
import { 
  BookOpen, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  FileText, 
  ShieldCheck, 
  Info,
  Clock
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import apiClient from '../services/api';

export const KnowledgeAssistant = () => {
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: 'Hello! I am your ReLife-Spark Knowledge Assistant foundation. When Milestone 3 is active, I will answer your technical smartphone questions by querying verified OEM repair guides, warranty documents, and teardowns via MongoDB Atlas Vector Search.',
      sources: [
        { title: 'Apple iPhone 13 Repair Manual', page: 'Section 4.2' },
        { title: 'Samsung Galaxy Display Service Guidelines', page: 'Page 18' },
      ],
      timestamp: 'Just now',
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputQuery.trim() || loading) return;

    const userMessage = {
      sender: 'user',
      text: inputQuery.trim(),
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentQuery = inputQuery.trim();
    setInputQuery('');
    setLoading(true);

    try {
      const response = await apiClient.post('/assistant/chat', {
        message: currentQuery,
        deviceContext: { platform: 'ReLife-Spark Web' },
      });

      const botReply = {
        sender: 'assistant',
        text: response?.reply?.text || response.message,
        sources: response?.reply?.sources || [],
        timestamp: 'Just now',
      };

      setMessages((prev) => [...prev, botReply]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: `Backend Error: ${err.message}. Make sure the Express server is running on port 5000.`,
          sources: [],
          timestamp: 'Just now',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-emerald-700 tracking-wider">
          <BookOpen className="w-4 h-4" />
          Step 3: Document-Grounded Assistant
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          Knowledge Assistant (RAG)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Ask questions about smartphone repair feasibility, battery replacements, and warranty policies.
        </p>
      </div>

      {/* Milestone 3 Notice Banner */}
      <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-4 text-xs text-purple-900 flex items-start gap-3">
        <Info className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">RAG Architecture In Preparation:</span> This interface communicates live with `/api/assistant/chat`. In Milestone 3, this assistant will embed your questions with `text-embedding-004`, execute vector search over indexed OEM manuals in MongoDB Atlas, and cite exact page numbers.
        </div>
      </div>

      {/* Chat Window */}
      <Card className="flex flex-col h-[520px] p-0 overflow-hidden border-slate-200 shadow-sm">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
          {messages.map((msg, index) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={index}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-xl space-y-2`}>
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      isUser
                        ? 'bg-slate-900 text-white rounded-br-none'
                        : 'bg-white border border-slate-200 text-slate-800 shadow-xs rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Sources Reference Display Area */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Referenced Documentation:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {msg.sources.map((src, sIdx) => (
                          <span
                            key={sIdx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-medium text-slate-700 shadow-2xs"
                          >
                            <FileText className="w-3 h-3 text-emerald-600" />
                            {src.title} — {src.page}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <span className={`text-[10px] text-slate-400 block ${isUser ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp}
                  </span>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500">
                Contacting ReLife-Spark API server...
              </div>
            </div>
          )}
        </div>

        {/* Chat Input Bar */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200 flex items-center gap-3">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="e.g. Can an iPhone 13 screen be swapped without losing True Tone?"
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <Button
            type="submit"
            variant="primary"
            icon={Send}
            disabled={!inputQuery.trim() || loading}
          >
            Send
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default KnowledgeAssistant;

