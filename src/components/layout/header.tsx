"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { User } from "next-auth";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

interface HeaderProps {
  user?: User | null;
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="border-b w-full sticky top-0 bg-background z-40">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6 font-medium">
          <Link
            href={user ? "/dashboard" : "/"}
            className="text-xl font-bold truncate max-w-[180px] sm:max-w-none"
          >
            Job Search Assistant
          </Link>
          {user && (
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
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {user ? (
            <>
              <span className="hidden md:inline text-sm text-muted-foreground truncate max-w-[150px] lg:max-w-[250px]">
                {user.name || user.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="sm:text-base sm:h-10"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Sign out
              </Button>
              {/* Mobile menu button */}
              {user && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={toggleMobileMenu}
                >
                  {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </Button>
              )}
            </>
          ) : (
            <Link href="/auth/login">
              <Button
                variant="default"
                size="sm"
                className="sm:text-base sm:h-10"
              >
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {user && mobileMenuOpen && (
        <div className="md:hidden border-t">
          <nav className="flex flex-col py-2 px-4 bg-background">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`py-3 ${
                  pathname === item.href
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
