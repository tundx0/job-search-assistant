"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { User } from "next-auth";
import { Button } from "@/components/ui/button";

interface NavigationProps {
  user: User;
}

export function Navigation({ user }: NavigationProps) {
  const pathname = usePathname();
  
  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
    },
    {
      name: "New Application",
      href: "/jobs/new",
    },
    {
      name: "Profile",
      href: "/profile",
    },
    {
      name: "Settings",
      href: "/settings",
    },
  ];

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6 font-medium">
          <Link href="/dashboard" className="text-xl font-bold">
            Job Search Assistant
          </Link>
          <nav className="hidden md:flex gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  pathname === item.href
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-primary"
                }
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden md:inline text-sm text-muted-foreground">
            {user.name || user.email}
          </span>
          <Button
            variant="outline"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
