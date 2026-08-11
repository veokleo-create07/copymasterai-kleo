import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}

export function Card({
  children,
  className = "",
  title,
  subtitle,
  action,
}: CardProps) {
  return (
    <section
      className={`rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm shadow-slate-900/5 ${className}`}
    >
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div>
            {title ? (
              <h3 className="text-sm font-semibold tracking-tight text-slate-900">
                {title}
              </h3>
            ) : null}
            {subtitle ? (
              <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
            ) : null}
          </div>
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}
