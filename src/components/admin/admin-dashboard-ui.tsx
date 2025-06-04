"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  BarChart,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/page-loader";

// Navigation items for the admin sidebar
const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/applications", label: "Applications", icon: FileText },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

// Sidebar component
function AdminSidebar({ 
  isOpen, 
  onClose, 
  pathname 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  pathname: string;
}) {
  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-56 sm:w-64 transform bg-gray-900 text-white transition-transform duration-200 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:static lg:z-10`}
      >
        <div className="flex h-14 sm:h-16 items-center justify-between border-b border-gray-800 px-3 sm:px-4">
          <h1 className="text-base sm:text-xl font-bold truncate">Admin Dashboard</h1>
          <button 
            className="p-1 rounded-md hover:bg-gray-800 lg:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        <nav className="mt-4 sm:mt-6 px-3 sm:px-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center rounded-md px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base transition-colors ${isActive ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800/70 hover:text-white'}`}
                  >
                    <Icon className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}

            <li className="mt-6 sm:mt-8">
              <Link
                href="/"
                className="flex items-center rounded-md px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-300 hover:bg-gray-800/70 hover:text-white transition-colors"
              >
                <LogOut className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                <span className="truncate">Back to App</span>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
}

// Mobile header component
function MobileHeader({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  return (
    <header className="sticky top-0 z-10 flex h-14 sm:h-16 items-center bg-white dark:bg-gray-800 shadow-sm lg:hidden px-3 sm:px-4">
      <Button 
        variant="ghost" 
        size="icon"
        onClick={onOpenSidebar}
        className="mr-2 h-8 w-8 sm:h-9 sm:w-9"
      >
        <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>
      <h1 className="text-base sm:text-lg font-medium truncate">Admin Dashboard</h1>
    </header>
  );
}

// Main client component for admin dashboard UI
export function AdminDashboardUI({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // Simulate page loading
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading) {
    return <PageLoader fullScreen message="Loading admin dashboard..." />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        pathname={pathname} 
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <MobileHeader onOpenSidebar={() => setSidebarOpen(true)} />
        
        {/* Page content */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
