import { Card } from "@/components/ui/Card";

export function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card className="text-center">
      <p className="text-3xl font-bold text-red-600">{value}</p>
      <p className="mt-1 text-sm font-medium text-zinc-600">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-zinc-400">{hint}</p>}
    </Card>
  );
}
