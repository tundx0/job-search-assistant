"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { User } from "next-auth";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/layout/wordmark";
import { Menu, X, LogOut } from "lucide-react";

interface HeaderProps {
  user?: User | null;
}

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "New application", href: "/jobs/new" },
  { name: "Profile", href: "/profile" },
  { name: "Templates", href: "/templates" },
  { name: "Settings", href: "/settings" },
];

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--rule)] bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[84rem] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-8">
          <Wordmark href={user ? "/dashboard" : "/"} />

          {user && (
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`relative rounded-md px-3 py-2 font-mono text-[0.6875rem] uppercase tracking-[0.14em] transition-colors ${
                    isActive(item.href)
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.name}
                  {isActive(item.href) && (
                    <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-primary" />
                  )}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <span className="hidden max-w-[16ch] truncate font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted-foreground xl:inline">
                {user.name || user.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut aria-hidden="true" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-expanded={mobileMenuOpen}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="hidden sm:block">
                <Button variant="outline" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm">Start free</Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {user && mobileMenuOpen && (
        <nav
          className="border-t border-[var(--rule)] bg-background lg:hidden"
          aria-label="Primary mobile"
        >
          <ul className="mx-auto w-full max-w-[84rem] px-4 py-2 sm:px-6">
            {NAV_ITEMS.map((item) => (
              <li key={item.href} className="border-b border-[var(--rule-soft)] last:border-0">
                <Link
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`flex items-center justify-between py-3.5 font-mono text-[0.6875rem] uppercase tracking-[0.14em] ${
                    isActive(item.href) ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.name}
                  {isActive(item.href) && <span aria-hidden="true">&mdash;</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
