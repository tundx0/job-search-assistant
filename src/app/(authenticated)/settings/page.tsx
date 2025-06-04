import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
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
  
  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/4">
          <SettingsSidebar />
        </div>
        <div className="w-full md:w-3/4">
          <SettingsContent user={user} />
        </div>
      </div>
    </div>
  );
}
