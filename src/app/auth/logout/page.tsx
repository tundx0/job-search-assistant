"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

export default function LogoutPage() {
  useEffect(() => {
    void signOut({ callbackUrl: "/auth/login" });
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-8">
      <p className="text-sm text-muted-foreground">Signing out...</p>
    </div>
  );
}
