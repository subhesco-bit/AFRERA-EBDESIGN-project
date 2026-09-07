import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StatCard from './StatCard';

describe('StatCard Component', () => {
  it('should render stat card with title and value', () => {
    render(
      <StatCard
        title="Account Balance"
        value="₹5,250"
      />,
    );

    expect(screen.getByText('Account Balance')).toBeTruthy();
    expect(screen.getByText('₹5,250')).toBeTruthy();
  });

  it('should render with icon', () => {
    render(
      <StatCard
        title="Orders"
        value="12"
        icon="📦"
      />,
    );

    expect(screen.getByText('📦')).toBeTruthy();
  });

  it('should display positive trend', () => {
    render(
      <StatCard
        title="Growth"
        value="150%"
        trend={{ positive: true, percentage: 15 }}
      />,
    );

    expect(screen.getByText(/15%/)).toBeTruthy();
  });

  it('should display negative trend', () => {
    render(
      <StatCard
        title="Decline"
        value="50%"
        trend={{ positive: false, percentage: 5 }}
      />,
    );

    expect(screen.getByText(/5%/)).toBeTruthy();
  });

  it('should call onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(
      <StatCard
        title="Clickable"
        value="100"
        onClick={handleClick}
      />,
    );

    const card = screen.getByText('Clickable').parentElement.parentElement;
    fireEvent.click(card);

    expect(handleClick).toHaveBeenCalled();
  });

  it('should render without icon if not provided', () => {
    const { container } = render(
      <StatCard
        title="No Icon"
        value="999"
      />,
    );

    expect(container.querySelector('.stat-icon')).toBeFalsy();
  });

  it('should render without trend if not provided', () => {
    const { container } = render(
      <StatCard
        title="No Trend"
        value="500"
      />,
    );

    expect(container.querySelector('.stat-trend')).toBeFalsy();
  });
});
