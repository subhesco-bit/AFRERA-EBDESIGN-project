import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authorizationAPI } from '../services/api';
import { KeyRound, ShieldAlert, Users, ScrollText } from 'lucide-react';
import toast from 'react-hot-toast';

// Mirrors backend/src/services/authService.js:getUserPermissions() — the
// hardcoded role→permission map this page is meant to expose and manage.
// Used as the fallback catalogue when /authorization/roles has no backend yet.
const FALLBACK_ROLES = [
  { role: 'admin', permissions: ['*'] },
  { role: 'farmer', permissions: ['marketplace:read', 'marketplace:buy', 'farmer:read', 'farmer:update', 'orders:read', 'orders:create', 'contracts:read', 'contracts:create'] },
  { role: 'fpo', permissions: ['marketplace:read', 'marketplace:buy', 'farmer:read', 'farmer:update', 'fpo:read', 'fpo:update', 'orders:read', 'orders:manage', 'contracts:read', 'contracts:create', 'contracts:approve'] },
  { role: 'corporate', permissions: ['marketplace:read', 'marketplace:buy', 'orders:read', 'orders:create', 'procurement:read', 'procurement:create', 'contracts:read', 'contracts:create', 'contracts:approve'] },
  { role: 'consumer', permissions: ['marketplace:read', 'marketplace:buy', 'orders:read', 'orders:create'] },
  { role: 'logistics', permissions: ['logistics:read', 'logistics:update', 'shipments:read', 'shipments:update', 'vehicles:read', 'drivers:read'] },
  { role: 'horeca', permissions: ['marketplace:read', 'marketplace:buy', 'orders:read', 'orders:create', 'procurement:read'] },
];

function AuthorizationPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('roles');
  const [selectedRole, setSelectedRole] = useState(null);

  // v5 react-query object syntax (see LoginPage.jsx)
  const { data: rolesData, isLoading: rolesLoading, error: rolesError } = useQuery({
    queryKey: ['authorization-roles'],
    queryFn: async () => {
      const res = await authorizationAPI.getRoles();
      return res.data?.data ?? [];
    },
    retry: false,
  });

  const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['authorization-users'],
    queryFn: async () => (await authorizationAPI.getUsers()).data?.data ?? [],
  });

  const { data: auditData, isLoading: auditLoading, error: auditError } = useQuery({
    queryKey: ['authorization-audit-log'],
    queryFn: async () => (await authorizationAPI.getAuditLog()).data?.data ?? [],
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => authorizationAPI.updateUserRole(userId, { role }),
    onSuccess: () => {
      toast.success('Role updated');
      queryClient.invalidateQueries({ queryKey: ['authorization-users'] });
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to update role'),
  });

  // If the backend has no /authorization/roles route yet, fall back to the
  // role catalogue mirrored from authService.js so the permission matrix is
  // still real and useful rather than empty.
  const roles = (rolesData && rolesData.length > 0) ? rolesData : (rolesError ? FALLBACK_ROLES : (rolesData || []));
  const users = usersData || [];
  const auditLog = auditData || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <KeyRound className="w-6 h-6 mr-2 text-slate-700" />
          Authorization
        </h1>
        <p className="text-gray-600">Role and permission management, distinct from the signup role dropdown — view the permission matrix, reassign user roles and audit changes</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Roles defined</div>
          <div className="text-2xl font-bold text-gray-800">{roles.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Users</div>
          <div className="text-2xl font-bold text-gray-800">{users.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Audit entries</div>
          <div className="text-2xl font-bold text-gray-800">{auditLog.length}</div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[['roles', 'Permission Matrix'], ['users', 'User Roles'], ['audit', 'Audit Log']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 font-medium border-b-2 transition ${tab === id ? 'border-slate-700 text-slate-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'roles' && (
        <>
          {rolesLoading && <div className="animate-pulse h-40 bg-gray-200 rounded-lg" />}
          {rolesError && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 mb-4 flex items-start">
              <ShieldAlert className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>Backend endpoint /authorization/roles has not been built yet. Showing the role catalogue mirrored from authService.js's hardcoded permission map so this page is still useful — it will switch to live data once the route exists.</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map((r) => (
              <div key={r.role} className="bg-white rounded-lg shadow p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800 capitalize">{r.role}</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">{r.permissions.length} permission{r.permissions.length === 1 ? '' : 's'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {r.permissions.map((p) => (
                    <span key={p} className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 font-mono">{p}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'users' && (
        <>
          {usersLoading && <div className="animate-pulse h-40 bg-gray-200 rounded-lg" />}
          {usersError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
              Error loading users: {usersError.message}. Backend endpoint /authorization/users has not been built yet — this page is wired and ready once it is.
            </div>
          )}
          {!usersLoading && !usersError && (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reassign</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-10 text-center text-gray-500 flex items-center justify-center gap-2"><Users className="w-4 h-4" />No users found.</td></tr>
                  )}
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{u.name || u.email}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </td>
                      <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700 capitalize">{u.role}</span></td>
                      <td className="px-4 py-3">
                        <select
                          defaultValue={u.role}
                          onChange={(e) => updateRoleMutation.mutate({ userId: u.id, role: e.target.value })}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-500"
                        >
                          {FALLBACK_ROLES.map((r) => <option key={r.role} value={r.role}>{r.role}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'audit' && (
        <>
          {auditLoading && <div className="animate-pulse h-40 bg-gray-200 rounded-lg" />}
          {auditError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
              Error loading audit log: {auditError.message}. Backend endpoint /authorization/audit-log has not been built yet.
            </div>
          )}
          {!auditLoading && !auditError && (
            <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
              {auditLog.length === 0 && (
                <div className="px-4 py-10 text-center text-gray-500 flex items-center justify-center gap-2"><ScrollText className="w-4 h-4" />No audit entries yet.</div>
              )}
              {auditLog.map((entry) => (
                <div key={entry.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-800">{entry.description || `${entry.actor} changed ${entry.target}`}</div>
                    <div className="text-xs text-gray-500">{entry.created_at}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AuthorizationPage;
