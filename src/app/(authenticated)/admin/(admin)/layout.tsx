import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { AdminDashboardUI } from "@/components/admin/admin-dashboard-ui";

// Server Component that handles authentication
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  // Redirect if not logged in or not an admin
  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  // Pass the authenticated user to the client component
  return <AdminDashboardUI>{children}</AdminDashboardUI>;
}
