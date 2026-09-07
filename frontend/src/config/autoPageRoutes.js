import { lazy } from 'react';

const pageModules = import.meta.glob('../pages/**/*.{jsx,js}');

function fileToPath(file) {
  const rel = file
    .replace(/^\.\.\/pages\//, '')
    .replace(/\.(jsx|js)$/, '')
    .replace(/\\/g, '/');

  const parts = rel.split('/').map((segment) =>
    segment
      .replace(/Page$/, '')
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/_/g, '-')
      .toLowerCase()
  );

  return `/${parts.join('/')}`.replace(/\/+/g, '/');
}

export function getAutoPageRoutes(existingPaths = new Set()) {
  const routes = [];

  for (const [file, loader] of Object.entries(pageModules)) {
    const routePath = fileToPath(file);
    if (existingPaths.has(routePath)) continue;

    routes.push({
      path: routePath,
      component: lazy(loader),
      title: routePath,
      description: 'Auto-discovered page',
      keywords: 'auto-discovered',
      transition: 'fade',
      autoDiscovered: true,
      role: routePath.startsWith('/admin') ? 'admin' : undefined
    });
  }

  return routes.sort((a, b) => a.path.localeCompare(b.path));
}

export { pageModules };
