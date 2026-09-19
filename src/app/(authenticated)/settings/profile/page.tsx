import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { db } from "@/lib/db";

export default async function ProfileSettingsPage() {
  const sessionUser = await getCurrentUser();

  // Redirect to login if not authenticated
  if (!sessionUser) {
    redirect("/auth/login");
  }

  // Fetch the full user data from the database
  const user = await db.user.findUnique({
    where: { email: sessionUser.email as string },
  });

  if (!user) {
    redirect("/auth/login");
  }

  return <ProfileSettings user={user} />;
}
