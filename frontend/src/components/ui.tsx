import { type ReactNode, useState, useRef, useEffect } from "react";

// ─── Button ──────────────────────────────────────────────────────────────────

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  fullWidth?: boolean;
}

export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  className = "",
  type = "button",
  fullWidth,
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const variants = {
    primary:
      "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800",
    secondary:
      "bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    danger: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-slate-300 text-slate-700 hover:bg-slate-50",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"
          />
        </svg>
      )}

      {children}
    </button>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

interface BadgeProps {
  children: ReactNode;
  variant?:
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "purple"
    | "cyan";
  size?: "sm" | "md";
  dot?: boolean;
}

export function Badge({
  children,
  variant = "default",
  size = "sm",
  dot,
}: BadgeProps) {
  const variants = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20",
    warning: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
    danger: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
    info: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20",
    purple: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20",
    cyan: "bg-cyan-50 text-cyan-700 ring-1 ring-inset ring-cyan-600/20",
  };

  const dots = {
    default: "bg-slate-400",
    success: "bg-green-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
    info: "bg-blue-500",
    purple: "bg-indigo-500",
    cyan: "bg-cyan-500",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded font-medium ${variants[variant]} ${sizes[size]}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dots[variant]}`} />}

      {children}
    </span>
  );
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

type RunStatus =
  | "draft"
  | "pending"
  | "running"
  | "waiting"
  | "completed"
  | "failed";

export function StatusBadge({ status }: { status: RunStatus }) {
  const map: Record<
    RunStatus,
    {
      label: string;
      variant: BadgeProps["variant"];
    }
  > = {
    draft: {
      label: "Draft",
      variant: "default",
    },
    pending: {
      label: "Pending",
      variant: "default",
    },
    running: {
      label: "Running",
      variant: "info",
    },
    waiting: {
      label: "Waiting",
      variant: "warning",
    },
    completed: {
      label: "Completed",
      variant: "success",
    },
    failed: {
      label: "Failed",
      variant: "danger",
    },
  };

  const { label, variant } = map[status];

  return (
    <Badge variant={variant} dot>
      {label}
    </Badge>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  error?: string;
  hint?: string;
  className?: string;
  autoFocus?: boolean;
  id?: string;
}

export function Input({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  error,
  hint,
  className = "",
  autoFocus,
  id,
}: InputProps) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          id={id}
          type={isPassword ? (show ? "text" : "password") : type}
          placeholder={placeholder}
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-md border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            error ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
          }`}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            aria-label={show ? "Hide password" : "Show password"}
            aria-pressed={show}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded px-1 text-xs text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {show ? "Hide" : "Show"}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  error?: string;
  className?: string;
  autoFocus?: boolean;
  id?: string;
}

export function Textarea({
  label,
  placeholder,
  value,
  onChange,
  rows = 4,
  error,
  className = "",
  autoFocus,
  id,
}: TextareaProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}

      <textarea
        id={id}
        placeholder={placeholder}
        value={value}
        rows={rows}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full resize-none rounded-md border px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
          error ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
        }`}
      />

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────

interface SelectProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: {
    value: string;
    label: string;
  }[];
  className?: string;
  id?: string;
}

export function Select({
  label,
  value,
  onChange,
  options,
  className = "",
  id,
}: SelectProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}

      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-white ${className}`}>
      {children}
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

interface TabsProps {
  tabs: {
    id: string;
    label: string;
    count?: number;
  }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, active, onChange, className = "" }: TabsProps) {
  return (
    <div
      className={`flex gap-0 border-b border-slate-200 ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-all ${
            active === tab.id
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          {tab.label}

          {tab.count !== undefined && (
            <span
              className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                active === tab.id
                  ? "bg-indigo-100 text-indigo-600"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

export function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .split(".")
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);

  /*
   * Changed: every user now receives the same
   * indigo-blue avatar color for a consistent
   * BlogForge identity across the application.
   */
  const color = "bg-indigo-600";

  const sizes = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-11 w-11 text-base",
  };

  return (
    <div
      className={`${color} ${sizes[size]} flex flex-shrink-0 items-center justify-center rounded-full font-semibold text-white`}
    >
      {initials}
    </div>
  );
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  color?: "default" | "success" | "warning" | "danger" | "indigo";
}

export function MetricCard({
  label,
  value,
  sub,
  color = "default",
}: MetricCardProps) {
  const colors = {
    default: "text-slate-900",
    success: "text-green-600",
    warning: "text-amber-600",
    danger: "text-red-600",
    indigo: "text-indigo-600",
  };

  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className={`mt-1 text-2xl font-bold ${colors[color]}`}>{value}</p>

      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </Card>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon && <div className="mb-4 text-slate-300">{icon}</div>}

      <h3 className="text-base font-semibold text-slate-700">{title}</h3>

      {description && (
        <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      )}

      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── LoadingSpinner ───────────────────────────────────────────────────────────

export function LoadingSpinner({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <svg
      className={`animate-spin ${sizes[size]} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      role="status"
      aria-label="Loading"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />

      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8z"
      />
    </svg>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: ModalProps) {
  const sizes = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
  };

  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      document.addEventListener("keydown", handler);
    }

    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="blogforge-modal-title"
        className={`relative flex max-h-[90vh] w-full flex-col rounded-xl bg-white shadow-2xl ${sizes[size]}`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2
            id="blogforge-modal-title"
            className="text-base font-semibold text-slate-900"
          >
            {title}
          </h2>

          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>

        {footer && (
          <div className="border-t border-slate-200 px-6 py-4">{footer}</div>
        )}
      </div>
    </div>
  );
}

// ─── Alert ────────────────────────────────────────────────────────────────────

interface AlertProps {
  variant?: "info" | "success" | "warning" | "danger";
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Alert({
  variant = "info",
  title,
  children,
  className = "",
}: AlertProps) {
  const styles = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    success: "bg-green-50 border-green-200 text-green-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    danger: "bg-red-50 border-red-200 text-red-800",
  };

  return (
    <div
      className={`rounded-lg border p-4 ${styles[variant]} ${className}`}
      role="alert"
    >
      {title && <p className="mb-1 text-sm font-semibold">{title}</p>}

      <div className="text-sm">{children}</div>
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

export function Divider({ className = "" }: { className?: string }) {
  return <div className={`border-t border-slate-200 ${className}`} />;
}

// ─── Logo ─────────────────────────────────────────────────────────────────────

export function BlogForgeLogo({
  dark = false,
  size = "md",
}: {
  dark?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const textSize = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
  };

  const iconSize = {
    sm: "h-6 w-6",
    md: "h-7 w-7",
    lg: "h-8 w-8",
  };

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`${iconSize[size]} flex flex-shrink-0 items-center justify-center rounded-lg bg-indigo-600`}
      >
        <svg viewBox="0 0 28 28" fill="none" className="h-4 w-4">
          <rect x="4" y="5" width="16" height="2.5" rx="1.25" fill="white" />

          <rect
            x="4"
            y="10"
            width="12"
            height="2.5"
            rx="1.25"
            fill="white"
            fillOpacity="0.7"
          />

          <rect
            x="4"
            y="15"
            width="14"
            height="2.5"
            rx="1.25"
            fill="white"
            fillOpacity="0.7"
          />

          <circle cx="22" cy="20" r="5" fill="#818CF8" />

          <path
            d="M20 20l1.5 1.5L24 18"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <span
        className={`font-bold tracking-tight ${textSize[size]} ${
          dark ? "text-white" : "text-slate-900"
        }`}
      >
        Blog
        <span className="text-indigo-600">Forge</span>
      </span>
    </div>
  );
}
