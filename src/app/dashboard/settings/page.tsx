"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>

      <Card className="bg-white border-gray-100">
        <CardHeader>
          <CardTitle className="text-gray-900">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-gray-500">Name</label>
            <p className="text-gray-900">Demo User</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Email</label>
            <p className="text-gray-900">demo@example.com</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-100">
        <CardHeader>
          <CardTitle className="text-gray-900">Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-900">Export All Data</div>
              <div className="text-sm text-gray-500">Download all transactions as CSV</div>
            </div>
            <Button variant="outline" className="border-gray-200 text-gray-700 rounded-xl">
              Export
            </Button>
          </div>
          <Separator className="bg-gray-100" />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-900">Clear All Data</div>
              <div className="text-sm text-gray-500">Permanently delete all transactions and statements</div>
            </div>
            <Button variant="destructive" className="rounded-xl">
              Clear Data
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-100">
        <CardHeader>
          <CardTitle className="text-gray-900">Classification Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm mb-4">
            Manage rules for automatic transaction classification. Rules are checked in priority order.
          </p>
          <Button variant="outline" className="border-gray-200 text-gray-700 rounded-xl">
            Manage Rules
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
