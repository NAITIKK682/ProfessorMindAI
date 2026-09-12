import { Bot, FileText, User } from 'lucide-react';

// ==================================================
// Types
// ==================================================

export interface ChatSource {
  filename?: string;
  document_name?: string;
  page?: number | string;
  text?: string;
}

export interface ChatMessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
  timestamp?: number;
}

interface ChatMessageProps {
  message: ChatMessageData;
  isStreaming?: boolean;
}

// ==================================================
// Component
// ==================================================

const ChatMessage = ({ message, isStreaming = false }: ChatMessageProps) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 w-full ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      
      {/* AI Avatar (Left) */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0 border border-teal-200 mt-1">
          <Bot size={16} className="text-teal-700" />
        </div>
      )}

      {/* Message Content */}
      <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        
        {/* Message Bubble */}
        <div
          className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words
            ${isUser 
              ? 'bg-teal-800 text-white rounded-2xl rounded-tr-sm shadow-sm' 
              : 'bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm'
            }`}
        >
          {message.content}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-teal-600 ml-1 animate-pulse rounded-sm align-middle" />
          )}
        </div>

        {/* Source References (Warm Gold Highlights) */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-2 w-full">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
              Sources
            </p>
            <div className="flex flex-wrap gap-2">
              {message.sources.map((source, idx) => {
                const label = source.filename || source.document_name || 'Unknown Document';
                const pageText = source.page ? ` · p.${source.page}` : '';
                
                return (
                  <div 
                    key={idx} 
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-md text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors cursor-default shadow-sm"
                    title={`${label}${pageText}`}
                  >
                    <FileText size={12} className="text-amber-600 shrink-0" />
                    <span className="truncate max-w-[160px]">
                      {label}{pageText}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Timestamp (Optional subtle meta) */}
        {message.timestamp && (
          <span className="text-[10px] text-slate-400 mt-1 px-1">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* User Avatar (Right) */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 border border-slate-300 mt-1">
          <User size={16} className="text-slate-600" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;