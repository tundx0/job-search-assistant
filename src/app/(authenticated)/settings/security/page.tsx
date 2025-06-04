import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import { db } from "@/lib/db";

export default async function SecuritySettingsPage() {
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
              <p className="text-gray-500">Security settings coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
