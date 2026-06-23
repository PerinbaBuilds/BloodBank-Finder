import type { LucideIcon } from "lucide-react";

export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  actions,
}: {
  icon?: LucideIcon;
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 via-white to-white px-6 py-7 shadow-soft">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_rgba(220,38,38,0.10),_transparent_65%)]"
      />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {Icon && (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-soft">
              <Icon className="h-5 w-5" />
            </span>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{title}</h1>
            {subtitle && <div className="mt-1 text-sm text-zinc-500">{subtitle}</div>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
