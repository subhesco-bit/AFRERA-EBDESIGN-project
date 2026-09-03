import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WalletCard from './WalletCard';

describe('WalletCard Component', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'test_token_123');
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should render loading state initially', () => {
    global.fetch.mockImplementationOnce(() =>
      new Promise(() => {}) // Never resolves to keep loading state
    );

    render(<WalletCard />);
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('should load and display wallet balance', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          balance: 5250.5,
        },
      }),
    });

    render(<WalletCard />);

    await waitFor(() => {
      expect(screen.getByText(/₹5250.50/)).toBeTruthy();
    });
  });

  it('should display wallet status as Active', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { balance: 1000 },
      }),
    });

    render(<WalletCard />);

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeTruthy();
    });
  });

  it('should display currency as INR', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { balance: 1000 },
      }),
    });

    render(<WalletCard />);

    await waitFor(() => {
      expect(screen.getByText('INR')).toBeTruthy();
    });
  });

  it('should call onAddFunds when Add Funds button is clicked', async () => {
    const handleAddFunds = jest.fn();

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { balance: 1000 },
      }),
    });

    render(<WalletCard onAddFunds={handleAddFunds} />);

    await waitFor(() => {
      const addFundsBtn = screen.getByText('+ Add Funds');
      fireEvent.click(addFundsBtn);
    });

    expect(handleAddFunds).toHaveBeenCalled();
  });

  it('should call onTransfer when Transfer button is clicked', async () => {
    const handleTransfer = jest.fn();

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { balance: 1000 },
      }),
    });

    render(<WalletCard onTransfer={handleTransfer} />);

    await waitFor(() => {
      const transferBtn = screen.getByText('Transfer');
      fireEvent.click(transferBtn);
    });

    expect(handleTransfer).toHaveBeenCalled();
  });

  it('should display error if fetch fails', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    render(<WalletCard />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load balance/)).toBeTruthy();
    });
  });

  it('should not render action buttons if callbacks not provided', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { balance: 1000 },
      }),
    });

    render(<WalletCard />);

    await waitFor(() => {
      expect(screen.queryByText('+ Add Funds')).toBeFalsy();
      expect(screen.queryByText('Transfer')).toBeFalsy();
    });
  });

  it('should format balance with 2 decimal places', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { balance: 5250.5 },
      }),
    });

    render(<WalletCard />);

    await waitFor(() => {
      expect(screen.getByText(/₹5250.50/)).toBeTruthy();
    });
  });
});
