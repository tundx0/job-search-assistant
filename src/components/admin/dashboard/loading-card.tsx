"use client";

import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LoadingCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="mr-2 h-4 w-4 animate-pulse" />
          <span>Loading...</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-40 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </CardContent>
    </Card>
  );
}
