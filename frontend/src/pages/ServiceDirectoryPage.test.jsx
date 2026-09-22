import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ServiceDirectoryPage from './ServiceDirectoryPage';

vi.mock('../store/authStore', () => ({ useAuthStore: () => ({ user: null, isAuthenticated: false }) }));
afterEach(cleanup);
const mount = (url = '/services') => render(<MemoryRouter initialEntries={[url]}><ServiceDirectoryPage /></MemoryRouter>);

test('restores a shareable search URL and links to the actual service', () => {
  mount('/services?q=mandi');
  expect(screen.getByRole('searchbox')).toHaveValue('mandi');
  expect(screen.getByRole('link', { name: 'Open Price Check' })).toHaveAttribute('href', '/price-check');
});
test('clears an empty search and restores results', () => {
  mount('/services?q=unfindableword');
  expect(screen.getByRole('status')).toHaveTextContent('0 services');
  fireEvent.click(screen.getByRole('button', { name: 'Clear search and filters' }));
  expect(screen.getByRole('searchbox')).toHaveValue('');
  expect(screen.queryByText(/No services match/)).not.toBeInTheDocument();
});
test('reveals more services without loading their pages', () => {
  mount();
  const before = screen.getAllByRole('listitem').length;
  fireEvent.click(screen.getByRole('button', { name: /Show more services/ }));
  expect(screen.getAllByRole('listitem').length).toBe(before + 24);
});
test('allows discovery of administrator services with a clear access label', () => {
  mount('/services?q=admin&audience=all');
  expect(screen.getAllByText('admin account required').length).toBeGreaterThan(0);
});
