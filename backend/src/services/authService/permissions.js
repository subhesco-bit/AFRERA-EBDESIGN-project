/**
 * Role -> permission mapping and permission checks.
 * Split out of the former monolithic services/authService.js (M11).
 */

/**
 * Get user permissions based on role
 */
function getUserPermissions(role) {
  const permissions = {
    admin: ['*'],
    farmer: [
      'marketplace:read',
      'marketplace:buy',
      'farmer:read',
      'farmer:update',
      'orders:read',
      'orders:create',
      'contracts:read',
      'contracts:create'
    ],
    fpo: [
      'marketplace:read',
      'marketplace:buy',
      'farmer:read',
      'farmer:update',
      'fpo:read',
      'fpo:update',
      'orders:read',
      'orders:manage',
      'contracts:read',
      'contracts:create',
      'contracts:approve'
    ],
    corporate: [
      'marketplace:read',
      'marketplace:buy',
      'orders:read',
      'orders:create',
      'procurement:read',
      'procurement:create',
      'contracts:read',
      'contracts:create',
      'contracts:approve'
    ],
    consumer: [
      'marketplace:read',
      'marketplace:buy',
      'orders:read',
      'orders:create'
    ],
    logistics: [
      'logistics:read',
      'logistics:update',
      'shipments:read',
      'shipments:update',
      'vehicles:read',
      'drivers:read'
    ],
    horeca: [
      'marketplace:read',
      'marketplace:buy',
      'orders:read',
      'orders:create',
      'procurement:read'
    ]
  };

  return permissions[role] || [];
}

/**
 * Check if user has permission
 */
function hasPermission(userPermissions, requiredPermission) {
  if (userPermissions.includes('*')) return true;
  return userPermissions.includes(requiredPermission);
}

module.exports = { getUserPermissions, hasPermission };
