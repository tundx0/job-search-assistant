"use client";

import { User } from "next-auth";
import { Header } from "./header";
import { Footer } from "./footer";

interface MainLayoutProps {
  children: React.ReactNode;
  user?: User | null;
}

export function MainLayout({ children, user }: MainLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <Header user={user} />
      <main className="flex-1 w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 md:px-8 overflow-x-hidden">
        {children}
      </main>
      <Footer />
    </div>
  );
}
