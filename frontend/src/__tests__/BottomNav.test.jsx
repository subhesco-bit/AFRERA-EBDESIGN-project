import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

describe('BottomNav', () => {
  it('renders touch-friendly primary destinations and marks nested routes active', () => {
    render(
      <MemoryRouter initialEntries={['/marketplace/bulk-purchase']}>
        <BottomNav />
      </MemoryRouter>,
    );

    expect(screen.getByRole('navigation', { name: 'Primary mobile navigation' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Market/i })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Profile/i })).toBeInTheDocument();
  });
});
