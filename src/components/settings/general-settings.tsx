"use client";

import { useState } from "react";
import { User } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, FileText } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface GeneralSettingsProps {
  user: User;
}

export function GeneralSettings({ user }: GeneralSettingsProps) {
  const router = useRouter();
  const [atsOptimizationEnabled, setAtsOptimizationEnabled] = useState(user.atsOptimizationEnabled || false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const handleAtsToggleChange = async (checked: boolean) => {
    setIsUpdating(true);
    setAtsOptimizationEnabled(checked);
    
    try {
      const response = await fetch('/api/settings/ats-optimization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ atsOptimizationEnabled: checked }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update ATS optimization setting');
      }
      
      toast.success('ATS optimization setting updated successfully');
      router.refresh();
    } catch (error) {
      console.error('Error updating ATS optimization setting:', error);
      toast.error('Failed to update ATS optimization setting');
      setAtsOptimizationEnabled(!checked); // Revert the toggle if the update fails
    } finally {
      setIsUpdating(false);
    }
  };
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">General Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage your general account settings and preferences
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Account Overview
          </CardTitle>
          <CardDescription>View your account information and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="text-base">{user.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-base">{user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Account Type</p>
                <p className="text-base capitalize">{user.role.toLowerCase()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Member Since</p>
                <p className="text-base">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resume Generation Settings
            </CardTitle>
            <CardDescription>Configure how your resumes are generated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ats-optimization">ATS Optimization</Label>
                  <p className="text-sm text-muted-foreground">
                    When enabled, your resumes will be optimized for Applicant Tracking Systems with enhanced skills, metrics, and keyword optimization.
                  </p>
                </div>
                <Switch
                  id="ats-optimization"
                  checked={atsOptimizationEnabled}
                  onCheckedChange={handleAtsToggleChange}
                  disabled={isUpdating}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
