/**
 * Organization & Tenant Management Page (Platform/Identity core)
 *
 * organizationManagementAPI and tenantManagementAPI already existed in
 * frontend/src/services/api.js and their backend routes
 * (organizationManagementRoutes.js / tenantManagementRoutes.js →
 * organizationManagementService.js / tenantManagementService.js) are real,
 * DB-backed services - but no page in frontend/src/pages/ ever called them
 * and neither was wired into frontend/src/config/routes.js. Added
 * 2026-09-07 as part of the Platform/Identity very-large-batch pass, same
 * tab layout convention as RolePermissionPage.jsx.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { organizationManagementAPI, tenantManagementAPI } from '../services/api';

const emptyOrgForm = { name: '', industry: '', size: '', businessModel: '', geography: '' };
const emptyTenantForm = { name: '', domain: '', tier: 'standard' };

const OrganizationTenantManagementPage = () => {
  const [activeTab, setActiveTab] = useState('organizations');
  const [organizations, setOrganizations] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orgForm, setOrgForm] = useState(emptyOrgForm);
  const [tenantForm, setTenantForm] = useState(emptyTenantForm);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'organizations') {
        const res = await organizationManagementAPI.getAllOrganizations();
        setOrganizations(res.data.organizations || []);
      } else {
        const res = await tenantManagementAPI.getAllTenants();
        setTenants(res.data.tenants || []);
      }
    } catch (err) {
      setError('Failed to load data: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async (e) => {
    e.preventDefault();
    try {
      await organizationManagementAPI.createOrganization(orgForm);
      setOrgForm(emptyOrgForm);
      loadData();
    } catch (err) {
      setError('Failed to create organization: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteOrganization = async (id) => {
    if (!window.confirm('Delete this organization?')) return;
    try {
      await organizationManagementAPI.deleteOrganization(id);
      loadData();
    } catch (err) {
      setError('Failed to delete organization: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    try {
      await tenantManagementAPI.createTenant(tenantForm);
      setTenantForm(emptyTenantForm);
      loadData();
    } catch (err) {
      setError('Failed to create tenant: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteTenant = async (id) => {
    if (!window.confirm('Delete this tenant?')) return;
    try {
      await tenantManagementAPI.deleteTenant(id);
      loadData();
    } catch (err) {
      setError('Failed to delete tenant: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Organization &amp; Tenant Management</h1>

      <div className="flex space-x-4 border-b">
        {['organizations', 'tenants'].map((tab) => (
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

      {activeTab === 'organizations' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Create Organization</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateOrganization} className="grid grid-cols-2 gap-3">
                <input
                  className="border rounded px-3 py-2"
                  placeholder="Name"
                  required
                  value={orgForm.name}
                  onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                />
                <input
                  className="border rounded px-3 py-2"
                  placeholder="Industry"
                  value={orgForm.industry}
                  onChange={(e) => setOrgForm({ ...orgForm, industry: e.target.value })}
                />
                <input
                  className="border rounded px-3 py-2"
                  placeholder="Size"
                  value={orgForm.size}
                  onChange={(e) => setOrgForm({ ...orgForm, size: e.target.value })}
                />
                <input
                  className="border rounded px-3 py-2"
                  placeholder="Geography"
                  value={orgForm.geography}
                  onChange={(e) => setOrgForm({ ...orgForm, geography: e.target.value })}
                />
                <Button type="submit" className="col-span-2">Create Organization</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organizations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {organizations.length === 0 && !loading && (
                  <div className="text-sm text-gray-500">No organizations yet.</div>
                )}
                {organizations.map((org) => (
                  <div key={org.id} className="flex justify-between items-center p-4 border rounded">
                    <div>
                      <div className="font-semibold">{org.name}</div>
                      <div className="text-sm text-gray-600">
                        {org.industry || 'n/a'} · {org.size || 'n/a'} · {org.status || 'active'}
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => handleDeleteOrganization(org.id)}>
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'tenants' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Create Tenant</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTenant} className="grid grid-cols-2 gap-3">
                <input
                  className="border rounded px-3 py-2"
                  placeholder="Name"
                  required
                  value={tenantForm.name}
                  onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })}
                />
                <input
                  className="border rounded px-3 py-2"
                  placeholder="Domain"
                  value={tenantForm.domain}
                  onChange={(e) => setTenantForm({ ...tenantForm, domain: e.target.value })}
                />
                <select
                  className="border rounded px-3 py-2"
                  value={tenantForm.tier}
                  onChange={(e) => setTenantForm({ ...tenantForm, tier: e.target.value })}
                >
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
                <Button type="submit" className="col-span-2">Create Tenant</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tenants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tenants.length === 0 && !loading && (
                  <div className="text-sm text-gray-500">No tenants yet.</div>
                )}
                {tenants.map((tenant) => (
                  <div key={tenant.id} className="flex justify-between items-center p-4 border rounded">
                    <div>
                      <div className="font-semibold">{tenant.name}</div>
                      <div className="text-sm text-gray-600">
                        {tenant.domain || 'n/a'} · {tenant.tier || 'standard'} · {tenant.status || 'active'}
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => handleDeleteTenant(tenant.id)}>
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Button onClick={loadData} variant="outline">
        Refresh Data
      </Button>
    </div>
  );
};

export default OrganizationTenantManagementPage;
