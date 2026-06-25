import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
}) {
  return (
    <Card className="text-center">
      {Icon && (
        <span className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600">
          <Icon className="h-4.5 w-4.5" />
        </span>
      )}
      <p className="text-3xl font-bold text-red-600">{value}</p>
      <p className="mt-1 text-sm font-medium text-zinc-600">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>}
    </Card>
  );
}
