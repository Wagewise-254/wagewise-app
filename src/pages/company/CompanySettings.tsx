//import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function CompanySettings() {
  // Maintenance flag
  const underMaintenance = true;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 🔔 Maintenance Banner */}
      {underMaintenance && (
        <Alert className="mb-6 border-yellow-400 bg-yellow-50">
          <AlertTitle>⚠️ Under Maintenance</AlertTitle>
          <AlertDescription>
            Company settings are temporarily disabled. Please check back later.
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-white rounded-xl shadow p-6 space-y-8">
        {/* Business Info */}
        <div>
          <label className="block text-sm font-medium mb-1">Business Name</label>
          <Input value="" placeholder="Business Name" disabled={underMaintenance} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Company Email</label>
          <Input value="" placeholder="Company Email" disabled={underMaintenance} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Company Phone</label>
          <Input value="" placeholder="Company Phone" disabled={underMaintenance} />
        </div>

        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-medium mb-1">Company Logo</label>
          <Input type="file" disabled={underMaintenance} />
        </div>

        {/* Save Button */}
        <Button disabled={underMaintenance}>Save Changes</Button>
      </div>
    </div>
  );
}
