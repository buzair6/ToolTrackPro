import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-medium text-gray-900 dark:text-white mb-2">Settings</h2>
        <p className="text-gray-600 dark:text-gray-400">Manage your account and application settings</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Under Construction</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8">
            <Settings className="h-16 w-16 mb-4" />
            <p>The settings page is currently under construction.</p>
            <p>Check back soon for updates!</p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}