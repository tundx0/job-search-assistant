"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Key, User, Shield, Bot } from "lucide-react";

const settingsNavItems = [
  { title: "General", href: "/settings", icon: Settings, exact: true },
  { title: "AI models", href: "/settings/ai-models", icon: Bot, exact: false },
  { title: "API keys", href: "/settings/api-keys", icon: Key, exact: false },
  { title: "Profile", href: "/settings/profile", icon: User, exact: false },
  { title: "Security", href: "/settings/security", icon: Shield, exact: false },
];

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Settings" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
      <ul className="flex gap-1 overflow-x-auto border-b border-[var(--rule)] pb-px lg:flex-col lg:gap-0.5 lg:overflow-visible lg:border-b-0 lg:border-l lg:border-[var(--rule)] lg:pb-0 lg:pl-0">
        {settingsNavItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex items-center gap-2.5 whitespace-nowrap px-3 py-2.5 font-mono text-[0.6875rem] uppercase tracking-[0.14em] transition-colors lg:-ml-px lg:border-l-2 ${
                  isActive
                    ? "text-foreground lg:border-primary"
                    : "text-muted-foreground hover:text-foreground lg:border-transparent"
                }`}
              >
                <item.icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{item.title}</span>
                {isActive && (
                  <span className="absolute inset-x-3 -bottom-px h-0.5 bg-primary lg:hidden" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
