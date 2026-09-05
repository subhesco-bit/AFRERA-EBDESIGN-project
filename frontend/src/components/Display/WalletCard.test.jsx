import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WalletCard from './WalletCard';
import { walletAPI } from '../../services/api';

jest.mock('../../services/api', () => ({
  walletAPI: {
    getBalance: jest.fn(),
  },
}));

describe('WalletCard Component', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'test_token_123');
    walletAPI.getBalance.mockResolvedValue({ data: { data: { balance: 1000 } } });
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should render loading state initially', () => {
    walletAPI.getBalance.mockImplementationOnce(() => new Promise(() => {}));

    render(<WalletCard />);
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('should load and display wallet balance', async () => {
    walletAPI.getBalance.mockResolvedValueOnce({ data: { data: { balance: 5250.5 } } });

    render(<WalletCard />);

    await waitFor(() => {
      expect(screen.getByText(/₹5250.50/)).toBeTruthy();
    });
  });

  it('should display wallet status as Active', async () => {
    walletAPI.getBalance.mockResolvedValueOnce({ data: { data: { balance: 1000 } } });

    render(<WalletCard />);

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeTruthy();
    });
  });

  it('should display currency as INR', async () => {
    walletAPI.getBalance.mockResolvedValueOnce({ data: { data: { balance: 1000 } } });

    render(<WalletCard />);

    await waitFor(() => {
      expect(screen.getByText('INR')).toBeTruthy();
    });
  });

  it('should call onAddFunds when Add Funds button is clicked', async () => {
    const handleAddFunds = jest.fn();

    walletAPI.getBalance.mockResolvedValueOnce({ data: { data: { balance: 1000 } } });

    render(<WalletCard onAddFunds={handleAddFunds} />);

    await waitFor(() => {
      const addFundsBtn = screen.getByText('+ Add Funds');
      fireEvent.click(addFundsBtn);
    });

    expect(handleAddFunds).toHaveBeenCalled();
  });

  it('should call onTransfer when Transfer button is clicked', async () => {
    const handleTransfer = jest.fn();

    walletAPI.getBalance.mockResolvedValueOnce({ data: { data: { balance: 1000 } } });

    render(<WalletCard onTransfer={handleTransfer} />);

    await waitFor(() => {
      const transferBtn = screen.getByText('Transfer');
      fireEvent.click(transferBtn);
    });

    expect(handleTransfer).toHaveBeenCalled();
  });

  it('should display error if fetch fails', async () => {
    walletAPI.getBalance.mockRejectedValueOnce(new Error('Failed to load balance'));

    render(<WalletCard />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load balance/)).toBeTruthy();
    });
  });

  it('should not render action buttons if callbacks not provided', async () => {
    walletAPI.getBalance.mockResolvedValueOnce({ data: { data: { balance: 1000 } } });

    render(<WalletCard />);

    await waitFor(() => {
      expect(screen.queryByText('+ Add Funds')).toBeFalsy();
      expect(screen.queryByText('Transfer')).toBeFalsy();
    });
  });

  it('should format balance with 2 decimal places', async () => {
    walletAPI.getBalance.mockResolvedValueOnce({ data: { data: { balance: 5250.5 } } });

    render(<WalletCard />);

    await waitFor(() => {
      expect(screen.getByText(/₹5250.50/)).toBeTruthy();
    });
  });
});
