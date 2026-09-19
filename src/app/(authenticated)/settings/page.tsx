import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { SettingsContent } from "@/components/settings/settings-content";
import { db } from "@/lib/db";

export default async function SettingsPage() {
  const sessionUser = await getCurrentUser();
  
  // Redirect to login if not authenticated
  if (!sessionUser) {
    redirect("/auth/login");
  }
  
  // Fetch the full user data from the database
  const user = await db.user.findUnique({
    where: { email: sessionUser.email as string }
  });
  
  if (!user) {
    redirect("/auth/login");
  }
  
  return <SettingsContent user={user} />;
}
