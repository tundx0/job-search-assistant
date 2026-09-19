import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { SecuritySettings } from "@/components/settings/security-settings";
import { db } from "@/lib/db";

export default async function SecuritySettingsPage() {
  const sessionUser = await getCurrentUser();

  if (!sessionUser) {
    redirect("/auth/login");
  }

  // Confirm the account still exists before rendering account settings.
  const user = await db.user.findUnique({
    where: { email: sessionUser.email as string },
  });

  if (!user) {
    redirect("/auth/login");
  }

  return <SecuritySettings />;
}
