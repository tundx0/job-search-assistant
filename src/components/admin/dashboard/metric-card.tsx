"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
}

export function MetricCard({ title, value, icon: Icon, subtitle }: MetricCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium truncate">{title}</CardTitle>
        <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0 ml-2" />
      </CardHeader>
      <CardContent>
        <div className="text-lg sm:text-2xl font-bold truncate">{value}</div>
        {subtitle && (
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
