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
    <div className="flex min-h-screen w-full flex-col">
      <Header user={user} />
      <main className="mx-auto w-full min-w-0 max-w-[84rem] flex-1 overflow-x-clip px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
