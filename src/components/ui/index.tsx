import React, { forwardRef } from 'react';

// Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';
    const variants = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
      secondary: 'border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus:ring-primary-500',
      ghost: 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] focus:ring-primary-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };
    const sizes = {
      sm: 'px-2.5 py-1.5 text-xs gap-1.5',
      md: 'px-3.5 py-2 text-sm gap-2',
      lg: 'px-5 py-2.5 text-base gap-2.5',
    };
    return (
      <button ref={ref} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// IconButton
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'secondary';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ size = 'md', variant = 'ghost', className = '', children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50';
    const variants = {
      ghost: 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
      secondary: 'border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]',
    };
    const sizes = { sm: 'w-7 h-7', md: 'w-8 h-8', lg: 'w-10 h-10' };
    return (
      <button ref={ref} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
        {children}
      </button>
    );
  }
);
IconButton.displayName = 'IconButton';

// Input
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label className="text-sm font-medium text-[var(--text-secondary)]">{label}</label>}
        <input
          ref={ref}
          className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors
            bg-[var(--bg-input)] text-[var(--text-primary)]
            border-[var(--border-default)] focus:border-primary-500 focus:ring-1 focus:ring-primary-500
            placeholder:text-[var(--text-tertiary)] outline-none
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
            ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';

// Textarea
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label className="text-sm font-medium text-[var(--text-secondary)]">{label}</label>}
        <textarea
          ref={ref}
          className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors resize-y min-h-[80px]
            bg-[var(--bg-input)] text-[var(--text-primary)]
            border-[var(--border-default)] focus:border-primary-500 focus:ring-1 focus:ring-primary-500
            placeholder:text-[var(--text-tertiary)] outline-none
            ${error ? 'border-red-500' : ''}
            ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

// Select
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label className="text-sm font-medium text-[var(--text-secondary)]">{label}</label>}
        <select
          ref={ref}
          className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors
            bg-[var(--bg-input)] text-[var(--text-primary)]
            border-[var(--border-default)] focus:border-primary-500 focus:ring-1 focus:ring-primary-500
            outline-none ${className}`}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    );
  }
);
Select.displayName = 'Select';

// Checkbox
interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({ checked, onChange, label, disabled }) => {
  return (
    <label className={`inline-flex items-center gap-2 cursor-pointer ${disabled ? 'opacity-50' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        disabled={disabled}
        className="w-4 h-4 rounded border-[var(--border-default)] text-primary-600 focus:ring-primary-500"
      />
      {label && <span className="text-sm text-[var(--text-primary)]">{label}</span>}
    </label>
  );
};

// Switch
interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, label, disabled }) => {
  return (
    <label className={`inline-flex items-center gap-3 cursor-pointer ${disabled ? 'opacity-50' : ''}`}>
      <div
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-primary-600' : 'bg-[var(--border-strong)]'}`}
      >
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
      {label && <span className="text-sm text-[var(--text-primary)]">{label}</span>}
    </label>
  );
};

// Badge
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-[var(--bg-hover)] text-[var(--text-secondary)]',
    primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
};

// Card
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, hoverable }) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-[var(--shadow-sm)]
        ${hoverable ? 'cursor-pointer hover:shadow-[var(--shadow-md)] hover:border-[var(--border-strong)] transition-all' : ''}
        ${className}`}
    >
      {children}
    </div>
  );
};

// Spinner
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <div className={`${sizes[size]} ${className}`}>
      <div className="w-full h-full border-2 border-[var(--border-default)] border-t-primary-600 rounded-full animate-spin-slow" />
    </div>
  );
};

// Skeleton
interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`bg-[var(--bg-hover)] rounded-lg animate-pulse ${className}`} />
  );
};

// EmptyState
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      {icon && <div className="mb-4 text-[var(--text-tertiary)]">{icon}</div>}
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
      {description && <p className="text-sm text-[var(--text-secondary)] max-w-md mb-4">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
};

// ErrorState
interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ title = 'Something went wrong', message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="mb-4 text-red-500">
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)] max-w-md mb-4">{message}</p>
      {onRetry && <Button variant="secondary" onClick={onRetry}>Try Again</Button>}
    </div>
  );
};

// Progress
interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({ value, max = 100, className = '' }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={`w-full h-2 bg-[var(--bg-hover)] rounded-full overflow-hidden ${className}`}>
      <div className="h-full bg-primary-600 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
    </div>
  );
};

// Tabs
interface TabsProps {
  tabs: { id: string; label: string; count?: number }[];
  activeTab: string;
  onChange: (id: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="flex border-b border-[var(--border-default)]">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
            ${activeTab === tab.id
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 text-xs text-[var(--text-tertiary)]">({tab.count})</span>
          )}
        </button>
      ))}
    </div>
  );
};

// Dialog
interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ open, onClose, title, children, footer }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-[var(--bg-overlay)]" />
      <div
        className="relative bg-[var(--bg-card)] rounded-xl shadow-[var(--shadow-lg)] border border-[var(--border-default)] w-full max-w-md mx-4 animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
          <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-[var(--border-default)] flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
};

// Toast
interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'error' | 'warning';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    info: 'border-primary-500 bg-primary-50 text-primary-800',
    success: 'border-green-500 bg-green-50 text-green-800',
    error: 'border-red-500 bg-red-50 text-red-800',
    warning: 'border-amber-500 bg-amber-50 text-amber-800',
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg border shadow-lg animate-slide-up ${colors[type]}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Tooltip
interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  return (
    <div className="relative group inline-flex">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-surface-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-surface-900" />
      </div>
    </div>
  );
};

// Drawer
interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  side?: 'left' | 'right';
}

export const Drawer: React.FC<DrawerProps> = ({ open, onClose, title, children, side = 'right' }) => {
  if (!open) return null;
  const sideClass = side === 'right' ? 'right-0' : 'left-0';
  return (
    <div className="fixed inset-0 z-50 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-[var(--bg-overlay)]" />
      <div
        className={`absolute top-0 ${sideClass} bottom-0 w-96 bg-[var(--bg-card)] border-l border-[var(--border-default)] shadow-[var(--shadow-lg)] animate-slide-up`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
          <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5 overflow-y-auto h-[calc(100%-60px)]">{children}</div>
      </div>
    </div>
  );
};
