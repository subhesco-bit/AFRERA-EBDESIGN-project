import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ProtectedRoute, RoleRoute } from './RouteGuard';
import { useAuthStore } from '../store/authStore';

vi.mock('../store/authStore', () => ({ useAuthStore: vi.fn() }));
const ProtectedChild = vi.fn(() => <p>Protected data</p>);
function LoginProbe() {
  const location = useLocation();
  return <p>Return to: {location.state?.from}</p>;
}
const mount = element => render(<MemoryRouter initialEntries={['/private?crop=rice#listing']}><Routes><Route path="/private" element={element} /><Route path="/login" element={<LoginProbe />} /><Route path="/unauthorized" element={<p>Access denied</p>} /></Routes></MemoryRouter>);

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.mockReturnValue({ user: { role: 'farmer', permissions: [] }, isAuthenticated: true, initialized: true, loading: false, checkAuth: vi.fn().mockResolvedValue(), initializeAuth: vi.fn() });
});
afterEach(cleanup);

test('does not mount children for the wrong role', async () => {
  mount(<ProtectedRoute requiredRole="admin"><ProtectedChild /></ProtectedRoute>);
  expect(await screen.findByText('Access denied')).toBeInTheDocument();
  expect(ProtectedChild).not.toHaveBeenCalled();
});
test('does not mount children when permissions are missing', async () => {
  mount(<ProtectedRoute requiredPermissions={['manage_users']}><ProtectedChild /></ProtectedRoute>);
  expect(await screen.findByText('Access denied')).toBeInTheDocument();
  expect(ProtectedChild).not.toHaveBeenCalled();
});
test('allows an authorized farmer', async () => {
  mount(<ProtectedRoute requiredRole="farmer"><ProtectedChild /></ProtectedRoute>);
  expect(await screen.findByText('Protected data')).toBeInTheDocument();
});
test.each(['protected', 'role'])('%s guard retains the complete destination when signing in', async kind => {
  useAuthStore.mockReturnValue({ user: null, isAuthenticated: false, initialized: true, loading: false, checkAuth: vi.fn().mockResolvedValue(), initializeAuth: vi.fn() });
  mount(kind === 'role' ? <RoleRoute allowedRoles={['farmer']}><ProtectedChild /></RoleRoute> : <ProtectedRoute><ProtectedChild /></ProtectedRoute>);
  await waitFor(() => expect(screen.getByText('Return to: /private?crop=rice#listing')).toBeInTheDocument());
  expect(ProtectedChild).not.toHaveBeenCalled();
});
