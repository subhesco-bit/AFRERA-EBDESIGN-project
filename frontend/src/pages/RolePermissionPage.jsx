/**
 * Role & Permission Management Page (M007) - AI Enhanced
 * 
 * This page provides AI-powered role and permission management:
 * - Dynamic role management
 * - Permission matrix
 * - User role assignments
 * - AI role recommendations
 * - Role hierarchy visualization
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { rolePermissionAPI } from '../services/api';

const RolePermissionPage = () => {
  const [roles, setRoles] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [permissionMatrix, setPermissionMatrix] = useState(null);
  const [roleHierarchy, setRoleHierarchy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('roles');

  useEffect(() => {
    loadRoleData();
  }, [activeTab]);

  const loadRoleData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (activeTab === 'roles') {
        // /api/v1/roles returns {roles, total} unwrapped, not {success, data}.
        const res = await rolePermissionAPI.listRoles();
        setRoles(res.data.roles);
      } else if (activeTab === 'permissions') {
        const res = await rolePermissionAPI.listPermissions();
        setPermissions(res.data.data);
      } else if (activeTab === 'matrix') {
        const res = await rolePermissionAPI.getPermissionMatrix();
        setPermissionMatrix(res.data.data);
      } else if (activeTab === 'hierarchy') {
        const res = await rolePermissionAPI.getRoleHierarchy();
        setRoleHierarchy(res.data.data);
      }
    } catch (err) {
      setError('Failed to load role data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (roleData) => {
    try {
      await rolePermissionAPI.createRole(roleData);
      alert('Role created successfully!');
      loadRoleData();
    } catch (err) {
      alert('Failed to create role: ' + err.message);
    }
  };

  const handleRecommendRole = async (userId) => {
    try {
      const recommendation = await rolePermissionAPI.recommendRoleForUser(userId);
      alert('Role recommendation: ' + JSON.stringify(recommendation));
    } catch (err) {
      alert('Failed to get recommendation: ' + err.message);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Role & Permission Management</h1>
      
      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        {['roles', 'permissions', 'matrix', 'hierarchy'].map(tab => (
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

      {/* Roles Tab */}
      {activeTab === 'roles' && roles && (
        <Card>
          <CardHeader>
            <CardTitle>Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {roles.map(role => (
                <div key={role.id} className="flex justify-between items-center p-4 border rounded">
                  <div>
                    <div className="font-semibold">{role.name}</div>
                    <div className="text-sm text-gray-600">{role.description}</div>
                  </div>
                  <div className="text-sm">{role.permissions?.length || 0} permissions</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permissions Tab */}
      {activeTab === 'permissions' && permissions && (
        <Card>
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {permissions.map(permission => (
                <div key={permission.id} className="p-4 border rounded">
                  <div className="font-semibold">{permission.resource} - {permission.action}</div>
                  <div className="text-sm text-gray-600">{permission.description}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permission Matrix Tab */}
      {activeTab === 'matrix' && permissionMatrix && (
        <Card>
          <CardHeader>
            <CardTitle>Permission Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              {permissionMatrix.roles?.length} roles, {permissionMatrix.permissions?.length} permissions
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Hierarchy Tab */}
      {activeTab === 'hierarchy' && roleHierarchy && (
        <Card>
          <CardHeader>
            <CardTitle>Role Hierarchy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {roleHierarchy.map(role => (
                <div key={role.id} className="p-4 border rounded">
                  <div className="font-semibold">{role.name}</div>
                  {role.children?.length > 0 && (
                    <div className="ml-4 mt-2 space-y-2">
                      {role.children.map(child => (
                        <div key={child.id} className="text-sm text-gray-600">- {child.name}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Button onClick={loadRoleData} variant="outline">
        Refresh Data
      </Button>
    </div>
  );
};

export default RolePermissionPage;