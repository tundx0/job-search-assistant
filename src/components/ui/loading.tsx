"use client";

import React from "react";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

export function Loading({ size = "md", text = "Loading..." }: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div
        className={`animate-spin rounded-full border-2 border-current border-t-transparent text-primary ${sizeClasses[size]}`}
      />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}
