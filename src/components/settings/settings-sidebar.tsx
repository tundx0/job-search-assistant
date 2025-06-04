"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Settings, 
  Key, 
  User, 
  Shield, 
  Bot
} from "lucide-react";

const settingsNavItems = [
  {
    title: "General",
    href: "/settings",
    icon: Settings,
    exact: true,
  },
  {
    title: "AI Models",
    href: "/settings/ai-models",
    icon: Bot,
    exact: false,
  },
  {
    title: "API Keys",
    href: "/settings/api-keys",
    icon: Key,
    exact: false,
  },
  {
    title: "Profile",
    href: "/settings/profile",
    icon: User,
    exact: false,
  },
  {
    title: "Security",
    href: "/settings/security",
    icon: Shield,
    exact: false,
  },
];

export function SettingsSidebar() {
  const pathname = usePathname();
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium">Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage your account settings
        </p>
      </div>
      <nav className="p-2">
        <ul className="space-y-1">
          {settingsNavItems.map((item) => {
            const isActive = item.exact 
              ? pathname === item.href 
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
              
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive
                      ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
