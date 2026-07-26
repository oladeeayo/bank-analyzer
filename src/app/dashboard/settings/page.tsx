"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-white">Settings</h1>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-slate-300">Name</label>
            <p className="text-white">Demo User</p>
          </div>
          <div>
            <label className="text-sm text-slate-300">Email</label>
            <p className="text-white">demo@example.com</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white">Export All Data</div>
              <div className="text-sm text-slate-400">Download all transactions as CSV</div>
            </div>
            <Button variant="outline" className="border-slate-700 text-white">
              Export
            </Button>
          </div>
          <Separator className="bg-slate-700" />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white">Clear All Data</div>
              <div className="text-sm text-slate-400">Permanently delete all transactions and statements</div>
            </div>
            <Button variant="destructive">
              Clear Data
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Classification Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-sm mb-4">
            Manage rules for automatic transaction classification. Rules are checked in priority order.
          </p>
          <Button variant="outline" className="border-slate-700 text-white">
            Manage Rules
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
