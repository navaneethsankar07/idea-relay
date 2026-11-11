import { forwardRef, InputHTMLAttributes, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, type = 'text', className, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
    const inputId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
            {label}
          </label>
        )}
        <div className="relative rounded-md shadow-sm">
          <input
            id={inputId}
            ref={ref}
            type={inputType}
            className={twMerge(
              clsx(
                'block w-full rounded-lg border text-sm transition-colors px-3 py-2.5',
                'focus:outline-none focus:ring-2 focus:ring-offset-1',
                error
                  ? 'border-rose-400 text-rose-900 placeholder-rose-300 focus:border-rose-500 focus:ring-rose-500'
                  : 'border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500',
                isPassword && 'pr-10',
                className
              )
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
