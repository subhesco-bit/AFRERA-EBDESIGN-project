/**
 * System Administration Page (M006) - AI Enhanced
 * 
 * This page provides AI-powered system administration capabilities:
 * - System settings management
 * - Audit log viewing
 * - System analytics
 * - Anomaly detection
 * - Predictive maintenance
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { userManagementAPI, auditComplianceAPI, securityAccessControlAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

const SystemAdministrationPage = () => {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [maintenance, setMaintenance] = useState(null);
  const [auditLogs, setAuditLogs] = useState(null);
  const [auditAnomalies, setAuditAnomalies] = useState(null);
  const [securityEvents, setSecurityEvents] = useState(null);
  const [ipLists, setIpLists] = useState({ whitelist: [], blacklist: [] });
  const [securityScore, setSecurityScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('settings');

  useEffect(() => {
    loadSystemData();
  }, [activeTab]);

  const loadSystemData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'settings') {
        const data = await userManagementAPI.getSettings();
        setSettings(data.data);
      } else if (activeTab === 'analytics') {
        const data = await userManagementAPI.getSystemAnalytics();
        setAnalytics(data.data);
      } else if (activeTab === 'anomalies') {
        const data = await userManagementAPI.detectAnomalies();
        setAnomalies(data.data);
      } else if (activeTab === 'maintenance') {
        const data = await userManagementAPI.getPredictiveMaintenance();
        setMaintenance(data.data);
      } else if (activeTab === 'audit') {
        const [logsRes, anomaliesRes] = await Promise.all([
          auditComplianceAPI.getAuditLogs({ limit: 25 }),
          auditComplianceAPI.detectAuditAnomalies({}),
        ]);
        setAuditLogs(logsRes.data?.data || null);
        setAuditAnomalies(anomaliesRes.data?.data || null);
      } else if (activeTab === 'security') {
        const requests = [
          securityAccessControlAPI.getSecurityEvents({ limit: 25 }),
          securityAccessControlAPI.getIpLists('whitelist'),
          securityAccessControlAPI.getIpLists('blacklist'),
        ];
        if (user?.id) {
          requests.push(securityAccessControlAPI.calculateSecurityScore(user.id));
        }
        const [eventsRes, whitelistRes, blacklistRes, scoreRes] = await Promise.all(requests);
        setSecurityEvents(eventsRes.data?.data || null);
        setIpLists({
          whitelist: whitelistRes.data?.data || [],
          blacklist: blacklistRes.data?.data || [],
        });
        setSecurityScore(scoreRes?.data?.data || null);
      }
    } catch (err) {
      setError('Failed to load system data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLogIntegrity = async (id) => {
    try {
      const res = await auditComplianceAPI.verifyAuditLogIntegrity(id);
      alert(res.data?.data?.valid ? 'Log integrity verified.' : `Log integrity check failed: ${res.data?.data?.error || 'unknown reason'}`);
    } catch (err) {
      alert('Failed to verify log integrity: ' + err.message);
    }
  };

  const handleUpdateSetting = async (name, value, description) => {
    try {
      await userManagementAPI.upsertSetting(name, value, description);
      alert('Setting updated successfully!');
      loadSystemData();
    } catch (err) {
      alert('Failed to update setting: ' + err.message);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">System Administration</h1>
      
      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        {['settings', 'analytics', 'anomalies', 'maintenance', 'audit', 'security'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 ${activeTab === tab ? 'border-b-2 border-blue-500' : ''}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {loading && <div className="text-center">Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}

      {/* Settings Tab */}
      {activeTab === 'settings' && settings && (
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {settings.map(setting => (
                <div key={setting.name} className="flex justify-between items-center p-4 border rounded">
                  <div>
                    <div className="font-semibold">{setting.name}</div>
                    <div className="text-sm text-gray-600">{setting.description}</div>
                  </div>
                  <div className="text-sm">{setting.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analytics && (
        <Card>
          <CardHeader>
            <CardTitle>System Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div><strong>Audit Patterns:</strong> {analytics.auditPatterns?.length || 0} patterns detected</div>
              <div><strong>Total Settings:</strong> {analytics.settingsHealth?.total_settings || 0}</div>
              <div><strong>Recently Updated:</strong> {analytics.settingsHealth?.recently_updated || 0}</div>
              <div><strong>AI Recommendations:</strong></div>
              <ul className="list-disc pl-4">
                {analytics.recommendations?.map((rec, i) => (
                  <li key={i}>{rec.message}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Anomalies Tab */}
      {activeTab === 'anomalies' && anomalies && (
        <Card>
          <CardHeader>
            <CardTitle>Anomaly Detection</CardTitle>
          </CardHeader>
          <CardContent>
            {anomalies.length === 0 ? (
              <div className="text-green-600">No anomalies detected</div>
            ) : (
              <div className="space-y-4">
                {anomalies.map((anomaly, i) => (
                  <div key={i} className={`p-4 border rounded ${anomaly.severity === 'critical' ? 'border-red-500' : 'border-yellow-500'}`}>
                    <div className="font-semibold">{anomaly.type}</div>
                    <div className="text-sm">Severity: {anomaly.severity}</div>
                    <div className="text-sm">Count: {anomaly.count}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Maintenance Tab */}
      {activeTab === 'maintenance' && maintenance && (
        <Card>
          <CardHeader>
            <CardTitle>Predictive Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div><strong>Current Load:</strong> {maintenance.currentLoad}</div>
              <div><strong>Trend:</strong> {maintenance.trend}</div>
              <div><strong>Recommendations:</strong></div>
              <ul className="list-disc pl-4">
                {maintenance.recommendations?.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit & Compliance Tab (M008) — real auditComplianceAPI, read-only
          audit log view + integrity verification + anomaly detection.
          Previously fully built on the backend with zero UI consumer. */}
      {activeTab === 'audit' && (
        <Card>
          <CardHeader>
            <CardTitle>Audit &amp; Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Recent Audit Log Entries</h3>
                {(!auditLogs?.items || auditLogs.items.length === 0) ? (
                  <div className="text-sm text-gray-500">No audit log entries found</div>
                ) : (
                  <div className="space-y-2">
                    {auditLogs.items.map((log) => (
                      <div key={log.id} className="flex justify-between items-center p-3 border rounded text-sm">
                        <div>
                          <div className="font-medium">{log.action} — {log.entity}</div>
                          <div className="text-gray-500">User: {log.user_id || 'system'} · {log.created_at ? new Date(log.created_at).toLocaleString() : ''}</div>
                        </div>
                        <button
                          onClick={() => handleVerifyLogIntegrity(log.id)}
                          className="px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50"
                        >
                          Verify Integrity
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {auditLogs?.pagination && (
                  <div className="text-xs text-gray-400 mt-2">
                    Page {auditLogs.pagination.page} of {auditLogs.pagination.totalPages} ({auditLogs.pagination.total} total)
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Detected Anomalies</h3>
                {!auditAnomalies || (Array.isArray(auditAnomalies) && auditAnomalies.length === 0) ? (
                  <div className="text-green-600 text-sm">No anomalies detected</div>
                ) : (
                  <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">{JSON.stringify(auditAnomalies, null, 2)}</pre>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security & Access Control Tab (M009) — real securityAccessControlAPI,
          read-only security events + IP allow/deny lists + security score.
          Previously fully built on the backend with zero UI consumer. */}
      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <CardTitle>Security &amp; Access Control</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {securityScore && (
                <div className="p-4 border rounded flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Security Score</div>
                    <div className="text-sm text-gray-500">Based on recent security events for your account</div>
                  </div>
                  <div className={`text-3xl font-bold ${securityScore.score >= 80 ? 'text-green-600' : securityScore.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {securityScore.score}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Recent Security Events</h3>
                {(!securityEvents?.items || securityEvents.items.length === 0) ? (
                  <div className="text-sm text-gray-500">No security events found</div>
                ) : (
                  <div className="space-y-2">
                    {securityEvents.items.map((ev) => (
                      <div key={ev.id} className={`p-3 border rounded text-sm ${ev.severity === 'critical' ? 'border-red-500' : ev.severity === 'high' ? 'border-orange-400' : ''}`}>
                        <div className="font-medium">{ev.event_type}</div>
                        <div className="text-gray-500">Severity: {ev.severity} · {ev.created_at ? new Date(ev.created_at).toLocaleString() : ''}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">IP Whitelist</h3>
                  {ipLists.whitelist.length === 0 ? (
                    <div className="text-sm text-gray-500">Empty</div>
                  ) : (
                    <ul className="text-sm space-y-1">
                      {ipLists.whitelist.map((entry) => (
                        <li key={entry.id} className="p-2 border rounded">{entry.ip_address} — {entry.description}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">IP Blacklist</h3>
                  {ipLists.blacklist.length === 0 ? (
                    <div className="text-sm text-gray-500">Empty</div>
                  ) : (
                    <ul className="text-sm space-y-1">
                      {ipLists.blacklist.map((entry) => (
                        <li key={entry.id} className="p-2 border rounded">{entry.ip_address} — {entry.description}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Button onClick={loadSystemData} variant="outline">
        Refresh Data
      </Button>
    </div>
  );
};

export default SystemAdministrationPage;