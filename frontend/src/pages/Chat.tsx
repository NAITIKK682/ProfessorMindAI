import { useState, useRef, useEffect } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Bot,
  Send,
  User,
  Notebook,
  BookOpen,
  FileText,
  Loader2,
  X,
} from 'lucide-react';

import { askQuestion } from '../services/questionService';
import { getApiError } from '../services/api';
import type { QuestionResponse } from '../types/chat';
import EmptyState from '../components/common/EmptyState';

function Chat() {
  const [params] = useSearchParams();

  const [notebookId, setNotebookId] = useState(
    params.get('notebook') || ''
  );

  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<QuestionResponse[]>([]);
  const [error, setError] = useState('');
  const [thinking, setThinking] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const questionInputRef = useRef<HTMLTextAreaElement>(null);

  // ==================================================
  // Auto-scroll to bottom when messages/thinking changes
  // ==================================================

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, thinking]);

  // ==================================================
  // Timer for long requests
  // ==================================================

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;

    if (thinking) {
      setTimeElapsed(0);

      timer = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      setTimeElapsed(0);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [thinking]);

  // ==================================================
  // Submit Question
  // ==================================================

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (
      !question.trim() ||
      !notebookId.trim() ||
      thinking
    ) {
      return;
    }

    const currentQuestion = question.trim();

    setQuestion('');
    setError('');
    setThinking(true);

    try {
      const response = await askQuestion({
        notebook_id: notebookId.trim(),
        question: currentQuestion,
      });

      setMessages((items) => [...items, response]);
    } catch (reason) {
      setError(
        getApiError(
          reason,
          'The AI service could not answer this question.'
        )
      );
    } finally {
      setThinking(false);
    }
  };

  // ==================================================
  // Enter = Send
  // Shift + Enter = New Line
  // ==================================================

  const handleKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey
    ) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  // ==================================================
  // Focus textarea when page loads
  // ==================================================

  useEffect(() => {
    questionInputRef.current?.focus();
  }, []);

  // ==================================================
  // Format AI Response
  // ==================================================

  const formatInlineText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);

    return parts.map((part, index) => {
      if (
        part.startsWith('**') &&
        part.endsWith('**')
      ) {
        return (
          <strong
            key={index}
            className="font-bold text-slate-900"
          >
            {part.slice(2, -2)}
          </strong>
        );
      }

      return <span key={index}>{part}</span>;
    });
  };

  const formatText = (text: string) => {
    if (!text) {
      return null;
    }

    const cleanedText = text
      .replace(/\\n/g, '\n')
      .replace(/\r\n/g, '\n');

    const lines = cleanedText.split('\n');

    return lines.map((line, index) => {
      const trimmedLine = line.trim();

      // --------------------------------------------------
      // Empty Line
      // --------------------------------------------------

      if (trimmedLine === '') {
        return (
          <div
            key={`empty-${index}`}
            className="h-2"
          />
        );
      }

      // --------------------------------------------------
      // H3 - ### Heading
      // --------------------------------------------------

      if (trimmedLine.startsWith('### ')) {
        return (
          <h3
            key={index}
            className="text-base font-bold text-slate-900 mt-4 mb-2"
          >
            {formatInlineText(
              trimmedLine.replace(/^###\s+/, '')
            )}
          </h3>
        );
      }

      // --------------------------------------------------
      // H2 - ## Heading
      // --------------------------------------------------

      if (trimmedLine.startsWith('## ')) {
        return (
          <h2
            key={index}
            className="text-lg font-bold text-slate-900 mt-5 mb-3"
          >
            {formatInlineText(
              trimmedLine.replace(/^##\s+/, '')
            )}
          </h2>
        );
      }

      // --------------------------------------------------
      // H1 - # Heading
      // --------------------------------------------------

      if (trimmedLine.startsWith('# ')) {
        return (
          <h1
            key={index}
            className="text-xl font-bold text-slate-900 mt-5 mb-3"
          >
            {formatInlineText(
              trimmedLine.replace(/^#\s+/, '')
            )}
          </h1>
        );
      }

      // --------------------------------------------------
      // Bullet Point
      // --------------------------------------------------

      if (
        trimmedLine.startsWith('- ') ||
        trimmedLine.startsWith('* ')
      ) {
        return (
          <div
            key={index}
            className="flex gap-2 text-slate-700 leading-relaxed mb-1"
          >
            <span className="text-teal-700 font-bold">
              •
            </span>

            <span>
              {formatInlineText(
                trimmedLine.substring(2)
              )}
            </span>
          </div>
        );
      }

      // --------------------------------------------------
      // Numbered List
      // --------------------------------------------------

      const numberedMatch =
        trimmedLine.match(/^(\d+)\.\s+(.*)$/);

      if (numberedMatch) {
        return (
          <div
            key={index}
            className="flex gap-2 text-slate-700 leading-relaxed mb-1"
          >
            <span className="font-semibold text-teal-700 min-w-[20px]">
              {numberedMatch[1]}.
            </span>

            <span>
              {formatInlineText(
                numberedMatch[2]
              )}
            </span>
          </div>
        );
      }

      // --------------------------------------------------
      // Image Reference
      // --------------------------------------------------

      if (line.includes('[Image Content]')) {
        return (
          <p
            key={index}
            className="text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2 mt-2 italic"
          >
            {line}
          </p>
        );
      }

      // --------------------------------------------------
      // Regular Paragraph
      // --------------------------------------------------

      return (
        <p
          key={index}
          className="text-slate-700 leading-relaxed mb-2"
        >
          {formatInlineText(line)}
        </p>
      );
    });
  };

  // ==================================================
  // UI
  // ==================================================

  return (
    <section className="flex flex-col h-full bg-slate-50 animate-fade-in">

      {/* ==================================================
          CHAT HEADER
          ================================================== */}

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

          {/* Notebook ID */}
          <div className="relative w-full sm:w-64">
            <Notebook
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />

            <input
              value={notebookId}
              onChange={(event) =>
                setNotebookId(event.target.value)
              }
              placeholder="Notebook ID"
              aria-label="Notebook ID"
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* ==================================================
          CHAT THREAD
          ================================================== */}

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 bg-white"
        style={{
          minHeight: 'calc(100vh - 220px)',
          maxHeight: 'calc(100vh - 220px)',
        }}
      >
        <div className="max-w-3xl mx-auto space-y-6">

          {/* ==================================================
              EMPTY STATE
              ================================================== */}

          {messages.length === 0 && !thinking ? (
            <EmptyState
              title="Your research companion"
              description="Ask a question and ProfessorMind will retrieve relevant passages from your notebook to help you study."
              action={
                <Link
                  to="/notebooks"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
                >
                  <BookOpen size={16} />
                  Find a notebook
                </Link>
              }
            />
          ) : (
            <>
              {/* ==================================================
                  MESSAGES
                  ================================================== */}

              {messages.map((message, index) => (
                <div
                  key={`${message.question}-${index}`}
                  className="space-y-4 animate-fade-in"
                >

                  {/* ==================================================
                      USER MESSAGE
                      ================================================== */}

                  <div className="flex gap-3 justify-end items-start">

                    {/* User Bubble */}
                    <div
                      className="max-w-[80%] md:max-w-[70%] px-4 py-3 rounded-2xl rounded-tr-sm shadow-md"
                      style={{
                        backgroundColor: '#115e59',
                        color: '#ffffff',
                      }}
                    >
                      <p
                        className="text-sm font-medium leading-relaxed whitespace-pre-wrap break-words"
                        style={{
                          color: '#ffffff',
                          WebkitTextFillColor: '#ffffff',
                          opacity: 1,
                        }}
                      >
                        {message.question}
                      </p>
                    </div>

                    {/* User Avatar */}
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0 border border-teal-200 mt-0.5">
                      <User
                        size={16}
                        className="text-teal-700"
                      />
                    </div>
                  </div>

                  {/* ==================================================
                      AI MESSAGE
                      ================================================== */}

                  <div className="flex gap-3 items-start">

                    {/* AI Avatar */}
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0 border border-teal-200">
                      <Bot
                        size={16}
                        className="text-teal-700"
                      />
                    </div>

                    {/* AI Content */}
                    <div className="max-w-[80%] md:max-w-[70%] space-y-3">

                      {/* AI Answer Bubble */}
                      <div className="bg-white border border-slate-200 px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm">

                        <div className="max-w-none text-sm">
                          {formatText(message.answer)}
                        </div>

                      </div>

                      {/* ==================================================
                          SOURCE REFERENCES
                          ================================================== */}

                      {message.sources &&
                        message.sources.length > 0 && (
                          <div className="flex flex-wrap gap-2 pl-1">

                            {message.sources.map(
                              (source, idx) => {
                                const sourceLabel =
                                  source.filename ||
                                  source.file_id ||
                                  'Source';

                                const pageLabel =
                                  source.page_number != null
                                    ? ` · p.${source.page_number}`
                                    : '';

                                const label = `${sourceLabel}${pageLabel}`;

                                return (
                                  <div
                                    key={idx}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-md text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors cursor-default"
                                    title={label}
                                  >
                                    <FileText
                                      size={12}
                                      className="text-amber-600 shrink-0"
                                    />

                                    <span className="truncate max-w-[150px]">
                                      {label}
                                    </span>
                                  </div>
                                );
                              }
                            )}

                          </div>
                        )}

                    </div>
                  </div>

                </div>
              ))}

              {/* ==================================================
                  THINKING STATE
                  ================================================== */}

              {thinking && (
                <div className="flex gap-3 animate-fade-in">

                  {/* AI Avatar */}
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0 border border-teal-200">
                    <Bot
                      size={16}
                      className="text-teal-700"
                    />
                  </div>

                  {/* Thinking Bubble */}
                  <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm min-w-[300px]">

                    <div className="flex items-center gap-2">

                      {/* Animated Dots */}
                      <div className="flex gap-1">
                        <span
                          className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"
                          style={{
                            animationDelay: '0ms',
                          }}
                        />

                        <span
                          className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"
                          style={{
                            animationDelay: '150ms',
                          }}
                        />

                        <span
                          className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"
                          style={{
                            animationDelay: '300ms',
                          }}
                        />
                      </div>

                      {/* Thinking Text */}
                      <div className="ml-1 space-y-1">

                        <span className="text-sm text-slate-500">
                          Analyzing sources...
                        </span>

                        {timeElapsed > 15 && (
                          <p className="text-xs text-amber-600 mt-1">
                            Complex question - this may take up to 2 minutes
                          </p>
                        )}

                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ==================================================
          ERROR STATE
          ================================================== */}

      {error && (
        <div className="px-4 pb-2">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm animate-fade-in">

            <span className="font-medium flex-1">
              {error}
            </span>

            <button
              onClick={() => setError('')}
              className="p-1 rounded hover:bg-red-100 text-red-400 hover:text-red-600"
              aria-label="Close error"
            >
              <X size={16} />
            </button>

          </div>
        </div>
      )}

      {/* ==================================================
          CHAT COMPOSER
          ================================================== */}

      <div className="sticky bottom-0 bg-white/80 backdrop-blur-md border-t border-slate-200 px-4 py-4">

        <form
          onSubmit={submit}
          className="max-w-3xl mx-auto"
        >
          <div className="relative flex items-end gap-3 bg-white border border-slate-200 rounded-xl shadow-sm focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all">

            {/* Textarea */}
            <textarea
              ref={questionInputRef}
              value={question}
              onChange={(event) =>
                setQuestion(event.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="Ask about your lecture notes..."
              rows={1}
              className="flex-1 resize-none bg-transparent px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none max-h-32 min-h-[44px] leading-relaxed"
              style={{
                overflow: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={
                thinking ||
                !question.trim() ||
                !notebookId.trim()
              }
              className="m-1.5 p-2.5 rounded-lg bg-teal-700 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-teal-800 transition-all duration-200 shrink-0 hover:shadow-md active:scale-95"
              aria-label="Send question"
            >
              {thinking ? (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Send size={18} />
              )}
            </button>

          </div>

          {/* Keyboard Hint */}
          <p className="text-[11px] text-slate-400 text-center mt-2">
            Press{' '}
            <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono">
              Enter
            </kbd>{' '}
            to send,{' '}
            <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono">
              Shift+Enter
            </kbd>{' '}
            for new line.
          </p>

        </form>
      </div>

    </section>
  );
}

export default Chat;