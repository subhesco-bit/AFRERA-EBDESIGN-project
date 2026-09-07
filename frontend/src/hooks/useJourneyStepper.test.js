import { act, renderHook } from '@testing-library/react';
import { useJourneyStepper } from './useJourneyStepper';

describe('useJourneyStepper', () => {
  beforeEach(() => window.localStorage.clear());

  it('blocks invalid steps and exposes the validation error', async () => {
    const { result } = renderHook(() => useJourneyStepper({
      steps: [{ validate: () => 'Name is required' }],
      initialData: { name: '' },
    }));

    await act(async () => {
      await result.current.goNext();
    });

    expect(result.current.currentStep).toBe(0);
    expect(result.current.status).toBe('invalid');
    expect(result.current.error).toBe('Name is required');
  });

  it('saves, advances, persists, and completes the journey', async () => {
    const save = jest.fn(async (data) => ({ ...data, saved: true }));
    const onComplete = jest.fn();
    const { result } = renderHook(() => useJourneyStepper({
      storageKey: 'booking-draft',
      steps: [
        { validate: () => null, save },
        { validate: () => null, save },
      ],
      initialData: { bookingId: 'B-1' },
      onComplete,
    }));

    await act(async () => {
      await result.current.goNext();
    });

    expect(result.current.currentStep).toBe(1);
    expect(save).toHaveBeenCalledWith({ bookingId: 'B-1' });
    expect(JSON.parse(window.localStorage.getItem('booking-draft'))).toMatchObject({
      currentStep: 1,
      data: { bookingId: 'B-1', saved: true },
    });

    await act(async () => {
      await result.current.goNext();
    });

    expect(result.current.status).toBe('complete');
    expect(onComplete).toHaveBeenCalledWith({ bookingId: 'B-1', saved: true });
  });

  it('goes back and cancellation removes persisted draft state', async () => {
    const { result } = renderHook(() => useJourneyStepper({
      storageKey: 'claim-draft',
      steps: [{ validate: () => null }, { validate: () => null }],
      initialData: { claimId: 'C-1' },
    }));

    await act(async () => {
      await result.current.goNext();
    });
    expect(result.current.currentStep).toBe(1);

    act(() => result.current.goBack());
    expect(result.current.currentStep).toBe(0);

    act(() => result.current.cancel());
    expect(result.current.status).toBe('cancelled');
    expect(result.current.data).toEqual({ claimId: 'C-1' });
    expect(window.localStorage.getItem('claim-draft')).toBeNull();
  });
});
