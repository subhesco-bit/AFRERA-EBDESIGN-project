// Keep return destinations inside this app and avoid login loops.
export function loginDestination(from, fallback = '/dashboard') {
  const target = typeof from === 'string' ? from : from?.pathname ? `${from.pathname}${from.search || ''}${from.hash || ''}` : '';
  if (!target.startsWith('/') || target.startsWith('//') || /[\\\u0000-\u0020]/.test(target)) return fallback;
  const pathname = target.split(/[?#]/)[0].replace(/\/+$/, '');
  return ['/login', '/register'].includes(pathname) ? fallback : target;
}
