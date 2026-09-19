"use client";

// No useState needed
import { usePathname } from "next/navigation";
import { User } from "@prisma/client";
import { GeneralSettings } from "./general-settings";
import { ApiKeysSettings } from "./api-keys-settings";
import { AiModelSettings } from "./ai-model-settings";
import { ProfileSettings } from "./profile-settings";
import { SecuritySettings } from "./security-settings";

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
      return <SecuritySettings />;
    }
    
    // Default to general settings
    return <GeneralSettings user={user} />;
  };
  
  return renderSettingsContent();
}
