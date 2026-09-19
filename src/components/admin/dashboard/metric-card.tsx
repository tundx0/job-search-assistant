"use client";

import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
}

export function MetricCard({ title, value, icon: Icon, subtitle }: MetricCardProps) {
  return (
    <div className="h-full rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="label-mono truncate">{title}</p>
        <Icon
          className="h-4 w-4 flex-shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
      <p className="stat-value mt-3 truncate">{value}</p>
      {subtitle && (
        <p className="mt-2 truncate text-[0.6875rem] text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  );
}
