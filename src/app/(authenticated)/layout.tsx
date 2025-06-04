import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { MainLayout } from "@/components/layout/main-layout";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <MainLayout user={user}>{children}</MainLayout>;
}
