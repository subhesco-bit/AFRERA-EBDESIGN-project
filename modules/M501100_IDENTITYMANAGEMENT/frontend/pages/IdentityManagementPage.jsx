import { useState } from 'react'
import { ShieldCheck, KeyRound, LogIn, Smartphone, Fingerprint, FileCheck, Clock } from 'lucide-react'
import {
  roleManagementAPI,
  permissionManagementAPI,
  ssoAPI,
  mfaManagementAPI,
  digitalIdentityAPI,
  consentManagementAPI,
  sessionManagementAPI,
} from '../services/api'
import ResourceManager from '../components/common/ResourceManager'

/**
 * Consolidated Identity domain sub-modules, batch 4: M014 (Role Management),
 * M015 (Permission Management), M016 (Single Sign-On), M017 (Multi-Factor
 * Authentication), M018 (Digital Identity), M019 (Consent Management), M020
 * (Session Management). M011/M012/M013 already have real pages/flows (user
 * management, login/register, AuthorizationPage.jsx) — not touched here.
 *
 * None of these seven have a dedicated CRUD-list backend route under any
 * name: authService.js has per-user 2FA setup/verify/disable (already
 * exposed as authAPI.setup2FA/verify2FA/disable2FA) but no device registry
 * list, and auditService.js/authService.js reference "permission" only in
 * passing. All seven tabs are built against conventional REST shapes.
 * Admin-gated, matching AuthorizationPage.jsx and the other identity/access
 * records pages.
 */
const TABS = [
  { id: 'roles', label: 'Roles', icon: ShieldCheck },
  { id: 'permissions', label: 'Permissions', icon: KeyRound },
  { id: 'sso', label: 'Single Sign-On', icon: LogIn },
  { id: 'mfa', label: 'MFA Devices', icon: Smartphone },
  { id: 'digital-identity', label: 'Digital Identity', icon: Fingerprint },
  { id: 'consent', label: 'Consent', icon: FileCheck },
  { id: 'sessions', label: 'Sessions', icon: Clock },
]

const PERMISSION_LEVELS = ['Basic', 'Standard', 'Elevated', 'Admin']
const ROLE_STATUS = ['Active', 'Inactive']
const ACTIONS = ['Create', 'Read', 'Update', 'Delete', 'Manage']
const PROTOCOLS = ['SAML', 'OAuth2', 'OIDC']
const ENABLED_STATUS = ['Enabled', 'Disabled']
const DEVICE_TYPES = ['Authenticator App', 'SMS', 'Email', 'Hardware Key']
const MFA_STATUS = ['Active', 'Revoked']
const IDENTITY_TYPES = ['Aadhaar', 'PAN', 'Voter ID', 'Passport', 'Other']
const VERIFICATION_STATUS = ['Pending', 'Verified', 'Rejected']
const CONSENT_TYPES = ['Data Sharing', 'Marketing', 'Third-Party', 'Research']
const CONSENT_STATUS = ['Granted', 'Revoked', 'Expired']
const SESSION_STATUS = ['Active', 'Expired', 'Terminated']

function IdentityManagementPage() {
  const [activeTab, setActiveTab] = useState('roles')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Identity Management</h1>
        <p className="text-gray-600">Roles, permissions, SSO, multi-factor auth, digital identity, consent and active sessions</p>
      </div>

      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center whitespace-nowrap ${
              activeTab === tab.id ? 'bg-slate-700 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-5 h-5 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'roles' && (
        <ResourceManager
          compact
          accent="indigo"
          queryKey="roles"
          idField="id"
          list={(params) => roleManagementAPI.getRoles(params)}
          create={(data) => roleManagementAPI.createRole(data)}
          update={(id, data) => roleManagementAPI.updateRole(id, data)}
          remove={(id) => roleManagementAPI.deleteRole(id)}
          searchPlaceholder="Search by role name..."
          emptyMessage="No roles recorded yet."
          newLabel="Add Role"
          backendNote="Backend endpoint /roles has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ role_name: '', description: '', permission_level: 'Basic', status: 'Active' }}
          requiredFields={['role_name']}
          columns={[
            { key: 'role_name', label: 'Role' },
            { key: 'description', label: 'Description' },
            { key: 'permission_level', label: 'Level' },
            { key: 'status', label: 'Status' },
          ]}
          fields={[
            { name: 'role_name', label: 'Role name', required: true },
            { name: 'description', label: 'Description', type: 'textarea', span: 2 },
            { name: 'permission_level', label: 'Permission level', type: 'select', options: PERMISSION_LEVELS },
            { name: 'status', label: 'Status', type: 'select', options: ROLE_STATUS },
          ]}
          stats={(items) => [
            { label: 'Roles', value: items.length },
            { label: 'Active', value: items.filter((i) => i.status === 'Active').length },
          ]}
        />
      )}

      {activeTab === 'permissions' && (
        <ResourceManager
          compact
          accent="blue"
          queryKey="permissions"
          idField="id"
          list={(params) => permissionManagementAPI.getPermissions(params)}
          create={(data) => permissionManagementAPI.createPermission(data)}
          update={(id, data) => permissionManagementAPI.updatePermission(id, data)}
          remove={(id) => permissionManagementAPI.deletePermission(id)}
          searchPlaceholder="Search by permission or resource..."
          emptyMessage="No permissions recorded yet."
          newLabel="Add Permission"
          backendNote="Backend endpoint /permissions has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ permission_name: '', resource: '', action: 'Read', role_assigned: '' }}
          requiredFields={['permission_name', 'resource']}
          columns={[
            { key: 'permission_name', label: 'Permission' },
            { key: 'resource', label: 'Resource' },
            { key: 'action', label: 'Action' },
            { key: 'role_assigned', label: 'Role' },
          ]}
          fields={[
            { name: 'permission_name', label: 'Permission name', required: true },
            { name: 'resource', label: 'Resource', required: true },
            { name: 'action', label: 'Action', type: 'select', options: ACTIONS },
            { name: 'role_assigned', label: 'Assigned role' },
          ]}
          stats={(items) => [
            { label: 'Permissions', value: items.length },
            { label: 'Resources covered', value: new Set(items.map((i) => i.resource).filter(Boolean)).size },
          ]}
        />
      )}

      {activeTab === 'sso' && (
        <ResourceManager
          compact
          accent="purple"
          queryKey="sso-providers"
          idField="id"
          list={(params) => ssoAPI.getProviders(params)}
          create={(data) => ssoAPI.createProvider(data)}
          update={(id, data) => ssoAPI.updateProvider(id, data)}
          remove={(id) => ssoAPI.deleteProvider(id)}
          searchPlaceholder="Search by provider name..."
          emptyMessage="No SSO providers configured yet."
          newLabel="Add Provider"
          backendNote="Backend endpoint /sso-providers has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ provider_name: '', protocol: 'OAuth2', client_id: '', status: 'Enabled', notes: '' }}
          requiredFields={['provider_name']}
          columns={[
            { key: 'provider_name', label: 'Provider' },
            { key: 'protocol', label: 'Protocol' },
            { key: 'client_id', label: 'Client ID' },
            { key: 'status', label: 'Status' },
          ]}
          fields={[
            { name: 'provider_name', label: 'Provider name', required: true },
            { name: 'protocol', label: 'Protocol', type: 'select', options: PROTOCOLS },
            { name: 'client_id', label: 'Client ID' },
            { name: 'status', label: 'Status', type: 'select', options: ENABLED_STATUS },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Providers', value: items.length },
            { label: 'Enabled', value: items.filter((i) => i.status === 'Enabled').length },
          ]}
        />
      )}

      {activeTab === 'mfa' && (
        <ResourceManager
          compact
          accent="teal"
          queryKey="mfa-devices"
          idField="id"
          list={(params) => mfaManagementAPI.getDevices(params)}
          create={(data) => mfaManagementAPI.createDevice(data)}
          update={(id, data) => mfaManagementAPI.updateDevice(id, data)}
          remove={(id) => mfaManagementAPI.deleteDevice(id)}
          searchPlaceholder="Search by user..."
          emptyMessage="No MFA devices enrolled yet."
          newLabel="Enroll Device"
          backendNote="Backend endpoint /mfa-devices has not been built yet — this registry is separate from the existing per-user authAPI.setup2FA/verify2FA/disable2FA flow, which has no device-listing route. This tab is wired and ready to work once one exists."
          initialForm={{ user_identifier: '', device_type: 'Authenticator App', enrolled_date: '', status: 'Active' }}
          requiredFields={['user_identifier']}
          columns={[
            { key: 'user_identifier', label: 'User' },
            { key: 'device_type', label: 'Device Type' },
            { key: 'enrolled_date', label: 'Enrolled' },
            { key: 'status', label: 'Status' },
          ]}
          fields={[
            { name: 'user_identifier', label: 'User (email / ID)', required: true },
            { name: 'device_type', label: 'Device type', type: 'select', options: DEVICE_TYPES },
            { name: 'enrolled_date', label: 'Enrolled date', type: 'date' },
            { name: 'status', label: 'Status', type: 'select', options: MFA_STATUS },
          ]}
          stats={(items) => [
            { label: 'Devices', value: items.length },
            { label: 'Active', value: items.filter((i) => i.status === 'Active').length },
          ]}
        />
      )}

      {activeTab === 'digital-identity' && (
        <ResourceManager
          compact
          accent="amber"
          queryKey="digital-identities"
          idField="id"
          list={(params) => digitalIdentityAPI.getIdentities(params)}
          create={(data) => digitalIdentityAPI.createIdentity(data)}
          update={(id, data) => digitalIdentityAPI.updateIdentity(id, data)}
          remove={(id) => digitalIdentityAPI.deleteIdentity(id)}
          searchPlaceholder="Search by identity reference..."
          emptyMessage="No digital identities recorded yet."
          newLabel="Add Identity"
          backendNote="Backend endpoint /digital-identities has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ identity_ref: '', identity_type: 'Aadhaar', verification_status: 'Pending', issued_date: '' }}
          requiredFields={['identity_ref']}
          columns={[
            { key: 'identity_ref', label: 'Reference' },
            { key: 'identity_type', label: 'Type' },
            { key: 'verification_status', label: 'Verification' },
            { key: 'issued_date', label: 'Issued' },
          ]}
          fields={[
            { name: 'identity_ref', label: 'Identity reference / number', required: true },
            { name: 'identity_type', label: 'Identity type', type: 'select', options: IDENTITY_TYPES },
            { name: 'verification_status', label: 'Verification status', type: 'select', options: VERIFICATION_STATUS },
            { name: 'issued_date', label: 'Issued date', type: 'date' },
          ]}
          stats={(items) => [
            { label: 'Identities', value: items.length },
            { label: 'Verified', value: items.filter((i) => i.verification_status === 'Verified').length },
          ]}
        />
      )}

      {activeTab === 'consent' && (
        <ResourceManager
          compact
          accent="green"
          queryKey="consent-records"
          idField="id"
          list={(params) => consentManagementAPI.getRecords(params)}
          create={(data) => consentManagementAPI.createRecord(data)}
          update={(id, data) => consentManagementAPI.updateRecord(id, data)}
          remove={(id) => consentManagementAPI.deleteRecord(id)}
          searchPlaceholder="Search by subject..."
          emptyMessage="No consent records yet."
          newLabel="Add Consent"
          backendNote="Backend endpoint /consent-records has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ subject_name: '', consent_type: 'Data Sharing', granted_date: '', expiry_date: '', status: 'Granted' }}
          requiredFields={['subject_name']}
          columns={[
            { key: 'subject_name', label: 'Subject' },
            { key: 'consent_type', label: 'Type' },
            { key: 'granted_date', label: 'Granted' },
            { key: 'expiry_date', label: 'Expires' },
            { key: 'status', label: 'Status' },
          ]}
          fields={[
            { name: 'subject_name', label: 'Subject name', required: true },
            { name: 'consent_type', label: 'Consent type', type: 'select', options: CONSENT_TYPES },
            { name: 'granted_date', label: 'Granted date', type: 'date' },
            { name: 'expiry_date', label: 'Expiry date', type: 'date' },
            { name: 'status', label: 'Status', type: 'select', options: CONSENT_STATUS },
          ]}
          stats={(items) => [
            { label: 'Records', value: items.length },
            { label: 'Granted', value: items.filter((i) => i.status === 'Granted').length },
          ]}
        />
      )}

      {activeTab === 'sessions' && (
        <ResourceManager
          compact
          accent="rose"
          queryKey="sessions"
          idField="id"
          list={(params) => sessionManagementAPI.getSessions(params)}
          update={(id, data) => sessionManagementAPI.updateSession(id, data)}
          remove={(id) => sessionManagementAPI.deleteSession(id)}
          searchPlaceholder="Search by user or IP..."
          emptyMessage="No active sessions recorded yet."
          backendNote="Backend endpoint /sessions has not been built yet — this tab is wired and ready to work once it is. Sessions are normally created by login, not manually — no 'add' form is offered here, only terminate/edit of existing entries."
          initialForm={{ user_identifier: '', device: '', ip_address: '', login_time: '', last_active: '', status: 'Active' }}
          columns={[
            { key: 'user_identifier', label: 'User' },
            { key: 'device', label: 'Device' },
            { key: 'ip_address', label: 'IP Address' },
            { key: 'login_time', label: 'Login Time' },
            { key: 'status', label: 'Status' },
          ]}
          fields={[
            { name: 'user_identifier', label: 'User (email / ID)' },
            { name: 'device', label: 'Device' },
            { name: 'ip_address', label: 'IP address' },
            { name: 'login_time', label: 'Login time', type: 'datetime-local' },
            { name: 'last_active', label: 'Last active', type: 'datetime-local' },
            { name: 'status', label: 'Status', type: 'select', options: SESSION_STATUS },
          ]}
          stats={(items) => [
            { label: 'Sessions', value: items.length },
            { label: 'Active', value: items.filter((i) => i.status === 'Active').length },
          ]}
        />
      )}
    </div>
  )
}

export default IdentityManagementPage
