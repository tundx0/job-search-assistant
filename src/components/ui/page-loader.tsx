"use client";

import React from "react";
import { Loading } from "./loading";

interface PageLoaderProps {
  fullScreen?: boolean;
  message?: string;
}

export function PageLoader({ 
  fullScreen = false, 
  message = "Loading page content..." 
}: PageLoaderProps) {
  return (
    <div 
      className={`flex flex-col items-center justify-center ${
        fullScreen 
          ? "fixed inset-0 bg-background/80 backdrop-blur-sm z-50" 
          : "w-full py-12"
      }`}
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        <Loading size="lg" text="" />
        <p className="text-lg text-muted-foreground animate-pulse">{message}</p>
      </div>
    </div>
  );
}
