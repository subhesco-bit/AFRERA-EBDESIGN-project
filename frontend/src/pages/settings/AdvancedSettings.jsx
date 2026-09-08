import React, { useState } from "react";
import { Settings2, Save } from "lucide-react";

export default function AdvancedSettings() {
  const [settings, setSettings] = useState({
    autoBackup: true,
    dataRetention: "1year",
    notifications: true,
  });

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      <div className="flex items-center gap-3 mb-8">
        <Settings2 className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Advanced Settings</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Auto Backup</label>
            <input type="checkbox" checked={settings.autoBackup} onChange={() => setSettings({...settings, autoBackup: !settings.autoBackup})} className="h-4 w-4" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Data Retention</label>
            <select value={settings.dataRetention} onChange={(e) => setSettings({...settings, dataRetention: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
              <option>1 year</option>
              <option>2 years</option>
              <option>Forever</option>
            </select>
          </div>
          <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Save size={20} />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
