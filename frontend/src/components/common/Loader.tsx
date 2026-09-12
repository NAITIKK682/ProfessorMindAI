import { Loader2 } from 'lucide-react';

export type LoaderSize = 'sm' | 'md' | 'lg' | 'xl';

interface LoaderProps {
  size?: LoaderSize;
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

const Loader = ({ 
  size = 'md', 
  text, 
  className = '', 
  fullScreen = false 
}: LoaderProps) => {
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const textClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  const containerClasses = fullScreen 
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm' 
    : 'flex flex-col items-center justify-center';

  return (
    <div 
      className={`${containerClasses} ${className}`} 
      role="status" 
      aria-label={text || "Loading"}
    >
      <Loader2 
        className={`animate-spin text-teal-700 ${sizeClasses[size]}`} 
        aria-hidden="true"
      />
      {text && (
        <p className={`mt-3 font-medium text-slate-600 ${textClasses[size]} animate-fade-in`}>
          {text}
        </p>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Loader;