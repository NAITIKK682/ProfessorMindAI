import { useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Bot, 
  MessageSquare, 
  Send, 
  User, 
  Notebook, 
  BookOpen, 
  FileText 
} from 'lucide-react';
import { askQuestion } from '../services/questionService';
import { getApiError } from '../services/api';
import type { QuestionResponse } from '../types/chat';

function Chat() {
  const [params] = useSearchParams();
  const [notebookId, setNotebookId] = useState(params.get('notebook') || '');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<QuestionResponse[]>([]);
  const [error, setError] = useState('');
  const [thinking, setThinking] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!question.trim() || !notebookId.trim() || thinking) return;
    
    const current = question.trim();
    setQuestion('');
    setError('');
    setThinking(true);
    
    try {
      const response = await askQuestion({ 
        notebook_id: notebookId.trim(), 
        question: current 
      });
      setMessages((items) => [...items, response]);
    } catch (reason) {
      setError(getApiError(reason, 'The AI service could not answer this question.'));
    } finally {
      setThinking(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  // Simple formatter to convert \n to actual line breaks and basic markdown
  const formatText = (text: string) => {
    if (!text) return '';
    return text
      .replace(/\\n/g, '\n')  // Convert escaped newlines
      .split('\n')
      .map((line, i) => {
        // Handle headings
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-lg font-bold text-slate-900 mt-4 mb-2">{line.replace('### ', '')}</h3>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-xl font-bold text-slate-900 mt-5 mb-3">{line.replace('## ', '')}</h2>;
        }
        if (line.startsWith('# ')) {
          return <h1 key={i} className="text-2xl font-bold text-slate-900 mt-6 mb-4">{line.replace('# ', '')}</h1>;
        }
        // Handle bullet points
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          return <li key={i} className="ml-4 text-slate-700 leading-relaxed">{line.trim().substring(2)}</li>;
        }
        // Handle numbered lists
        if (/^\d+\.\s/.test(line.trim())) {
          return <li key={i} className="ml-4 text-slate-700 leading-relaxed">{line.trim().replace(/^\d+\.\s/, '')}</li>;
        }
        // Empty lines
        if (line.trim() === '') {
          return <br key={i} />;
        }
        // Regular paragraphs
        return <p key={i} className="text-slate-700 leading-relaxed mb-2">{line}</p>;
      });
  };

  return (
    <section className="flex flex-col h-full bg-slate-50 animate-fade-in">
      
      {/* CHAT HEADER */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-teal-700 uppercase mb-0.5">
              Notebook Q&A
            </p>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Ask your course material
            </h2>
          </div>
          
          <div className="relative w-full sm:w-64">
            <Notebook size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={notebookId}
              onChange={(event) => setNotebookId(event.target.value)}
              placeholder="Notebook ID"
              aria-label="Notebook ID"
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* CHAT THREAD */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          
          {messages.length === 0 && !thinking ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center text-center py-16 px-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-4">
                <MessageSquare size={28} className="text-teal-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Your research companion</h3>
              <p className="text-slate-500 text-sm max-w-sm mb-6 leading-relaxed">
                Ask a question and ProfessorMind will retrieve relevant passages from your notebook to help you study.
              </p>
              <Link 
                to="/notebooks" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
              >
                <BookOpen size={16} />
                Find a notebook
              </Link>
            </div>
          ) : (
            <>
              {/* Messages */}
              {messages.map((message, index) => (
                <div key={`${message.question}-${index}`} className="space-y-4 animate-fade-in">
                  
                  {/* User Message - FIXED VISIBILITY */}
                  <div className="flex gap-3 justify-end">
                    <div className="max-w-[80%] md:max-w-[70%] bg-teal-700 text-white px-4 py-3 rounded-2xl rounded-tr-sm shadow-md">
                      <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{message.question}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0 border border-teal-200">
                      <User size={16} className="text-teal-700" />
                    </div>
                  </div>

                  {/* AI Message - FORMATTED OUTPUT */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0 border border-teal-200">
                      <Bot size={16} className="text-teal-700" />
                    </div>
                    <div className="max-w-[80%] md:max-w-[70%] space-y-3">
                      <div className="bg-white border border-slate-200 px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm">
                        <div className="prose prose-slate prose-sm max-w-none">
                          {formatText(message.answer)}
                        </div>
                      </div>
                      
                      {/* Source References */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="flex flex-wrap gap-2 pl-1">
                          {message.sources.map((source, idx) => {
                            const label = `${source.file_id || 'Source'}${source.page_number ? ` · p.${source.page_number}` : ''}`;
                            
                            return (
                              <div 
                                key={idx} 
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-md text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors cursor-default"
                                title={label}
                              >
                                <FileText size={12} className="text-amber-600 shrink-0" />
                                <span className="truncate max-w-[150px]">{label}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Thinking State */}
              {thinking && (
                <div className="flex gap-3 animate-fade-in">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0 border border-teal-200">
                    <Bot size={16} className="text-teal-700" />
                  </div>
                  <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-slate-500 ml-1">Analyzing sources...</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="px-4 pb-2">
          <div className="max-w-3xl mx-auto flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm animate-fade-in">
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* CHAT COMPOSER */}
      <div className="sticky bottom-0 bg-white/80 backdrop-blur-md border-t border-slate-200 px-4 py-4">
        <form onSubmit={submit} className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-3 bg-white border border-slate-200 rounded-xl shadow-sm focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all">
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your lecture notes..."
              rows={1}
              className="flex-1 resize-none bg-transparent px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none max-h-32 leading-relaxed"
            />
            <button
              type="submit"
              disabled={thinking || !question.trim() || !notebookId.trim()}
              className="m-1.5 p-2.5 rounded-lg bg-teal-700 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-teal-800 transition-all duration-200 shrink-0 hover:shadow-md active:scale-95"
              aria-label="Send question"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-[11px] text-slate-400 text-center mt-2">
            Press <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono">Enter</kbd> to send, <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono">Shift+Enter</kbd> for new line.
          </p>
        </form>
      </div>
    </section>
  );
}

export default Chat;