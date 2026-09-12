import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  title?: string;
  onRetry?: () => void;
  className?: string;
}

const ErrorMessage = ({
  message,
  title = 'Something went wrong',
  onRetry,
  className = '',
}: ErrorMessageProps) => (
  <div className={`flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 ${className}`} role="alert">
    <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-600" aria-hidden="true" />
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm text-red-700">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <RefreshCw size={15} aria-hidden="true" />
          Try again
        </button>
      )}
    </div>
  </div>
);

export default ErrorMessage;