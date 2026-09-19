"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Server, Database, Shield } from "lucide-react";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [systemInfo, setSystemInfo] = useState({
    databaseSize: "0 MB",
    storageUsed: "0 MB",
    backupStatus: "Not configured",
    lastBackup: "Never",
  });
  console.log(loading);

  // Fetch system info from API instead of directly using Prisma
  useEffect(() => {
    async function fetchSystemInfo() {
      try {
        setLoading(true);
        // This would be replaced with an actual API call
        // const response = await fetch('/api/admin/system-info');
        // const data = await response.json();

        // For now, just simulate data
        setTimeout(() => {
          setSystemInfo({
            databaseSize: "256 MB",
            storageUsed: "1.2 GB",
            backupStatus: "Enabled",
            lastBackup: "2025-05-31 12:00:00",
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Failed to fetch system info:", error);
        setLoading(false);
      }
    }

    fetchSystemInfo();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Admin settings</h1>
        <p className="text-muted-foreground">
          Configure system settings and preferences
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">
            <Settings className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="system">
            <Server className="mr-2 h-4 w-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="database">
            <Database className="mr-2 h-4 w-4" />
            Database
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure general application settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site-name">Site Name</Label>
                <Input id="site-name" defaultValue="Job Assistant" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="support-email">Support Email</Label>
                <Input
                  id="support-email"
                  type="email"
                  defaultValue="support@jobassistant.com"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="maintenance-mode" />
                <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
              </div>

              <Button>Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>
                View system status and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium">Database Size</h3>
                    <p className="text-lg font-bold">
                      {systemInfo.databaseSize}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Storage Used</h3>
                    <p className="text-lg font-bold">
                      {systemInfo.storageUsed}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Backup Status</h3>
                    <p className="text-lg font-bold">
                      {systemInfo.backupStatus}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Last Backup</h3>
                    <p className="text-lg font-bold">{systemInfo.lastBackup}</p>
                  </div>
                </div>

                <div className="pt-4">
                  <Button>Run System Diagnostics</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Management</CardTitle>
              <CardDescription>
                Manage database operations and backups
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="backup-frequency">Backup Frequency</Label>
                <select
                  id="backup-frequency"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline">Backup Now</Button>
                <Button variant="outline">Restore</Button>
                <Button variant="destructive">Purge Cache</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security and access control
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch id="two-factor" />
                <Label htmlFor="two-factor">Require 2FA for Admins</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="password-policy" defaultChecked />
                <Label htmlFor="password-policy">
                  Enforce Strong Password Policy
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="login-attempts" defaultChecked />
                <Label htmlFor="login-attempts">
                  Limit Failed Login Attempts
                </Label>
              </div>

              <div className="pt-4">
                <Button>Update Security Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
