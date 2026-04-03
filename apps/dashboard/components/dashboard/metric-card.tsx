import { Card } from "@/components/ui/card";

export function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <Card className="flex flex-col gap-1 p-5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-2xl font-bold text-foreground">{value}</span>
    </Card>
  );
}
