import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { AiModelSettings } from "@/components/settings/ai-model-settings";
import { db } from "@/lib/db";

export default async function AiModelsSettingsPage() {
  const sessionUser = await getCurrentUser();
  
  // Redirect to login if not authenticated
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
  
  return <AiModelSettings />;
}
