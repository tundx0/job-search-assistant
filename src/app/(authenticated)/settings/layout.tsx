import { SettingsSidebar } from "@/components/settings/settings-sidebar";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-8">
      <div className="page-head">
        <div>
          <p className="label-mono">Account</p>
          <h1 className="page-title mt-2">Settings</h1>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
        <SettingsSidebar />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
