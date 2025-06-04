import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { MainLayout } from "@/components/layout/main-layout";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is already logged in
  const user = await getCurrentUser();

  // If user is already authenticated, redirect to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return <MainLayout>{children}</MainLayout>;
}
