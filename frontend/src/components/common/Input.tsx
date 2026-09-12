import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leadingIcon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, leadingIcon, id, className = '', ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = `${inputId}-hint`;
    const errorId = `${inputId}-error`;
    const describedBy = error ? errorId : hint ? hintId : undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <div className="relative">
          {leadingIcon && (
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400" aria-hidden="true">
              {leadingIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`input-base ${leadingIcon ? 'pl-10' : ''} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''} ${className}`}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            {...props}
          />
        </div>
        {error ? (
          <p id={errorId} className="mt-1.5 text-xs text-red-600" role="alert">{error}</p>
        ) : hint ? (
          <p id={hintId} className="mt-1.5 text-xs text-slate-500">{hint}</p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;