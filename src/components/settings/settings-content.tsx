"use client";

// No useState needed
import { usePathname } from "next/navigation";
import { User } from "@prisma/client";
import { GeneralSettings } from "./general-settings";
import { ApiKeysSettings } from "./api-keys-settings";
import { AiModelSettings } from "./ai-model-settings";
import { ProfileSettings } from "./profile-settings";
// SecuritySettings will be implemented later
// import { SecuritySettings } from "./security-settings";

interface SettingsContentProps {
  user: User;
}

export function SettingsContent({ user }: SettingsContentProps) {
  const pathname = usePathname();
  
  // Determine which settings component to render based on the current path
  const renderSettingsContent = () => {
    if (pathname === "/settings") {
      return <GeneralSettings user={user} />;
    } else if (pathname === "/settings/api-keys") {
      return <ApiKeysSettings />;
    } else if (pathname === "/settings/ai-models") {
      return <AiModelSettings />;
    } else if (pathname === "/settings/profile") {
      return <ProfileSettings user={user} />;
    } else if (pathname === "/settings/security") {
      // Uncomment when SecuritySettings component is implemented
      // return <SecuritySettings user={user} />;
      return <div className="p-4">Security settings coming soon</div>;
    }
    
    // Default to general settings
    return <GeneralSettings user={user} />;
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {renderSettingsContent()}
    </div>
  );
}
