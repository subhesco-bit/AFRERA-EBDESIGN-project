import { useEffect, useState } from 'react';

function readStoredState(storageKey, initialData, stepCount) {
  if (!storageKey || typeof window === 'undefined') return { data: initialData, currentStep: 0 };

  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return { data: initialData, currentStep: 0 };
    const parsed = JSON.parse(stored);
    return {
      data: { ...initialData, ...(parsed.data || {}) },
      currentStep: Math.min(Math.max(Number(parsed.currentStep) || 0, 0), Math.max(stepCount - 1, 0)),
    };
  } catch {
    return { data: initialData, currentStep: 0 };
  }
}

function persistState(storageKey, state) {
  if (!storageKey || typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey, JSON.stringify(state));
}

export function useJourneyStepper({ steps, initialData = {}, storageKey, onComplete }) {
  const restored = readStoredState(storageKey, initialData, steps.length);
  const [data, setData] = useState(restored.data);
  const [currentStep, setCurrentStep] = useState(restored.currentStep);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === 'cancelled') return;
    persistState(storageKey, { data, currentStep });
  }, [data, currentStep, status, storageKey]);

  const updateData = (patch) => {
    setData((previous) => ({ ...previous, ...patch }));
    setError(null);
  };

  const goNext = async () => {
    const step = steps[currentStep];
    if (!step) return false;

    setStatus('saving');
    setError(null);
    try {
      const validationError = await step.validate?.(data);
      if (validationError) {
        setStatus('invalid');
        setError(validationError);
        return false;
      }

      const saved = await step.save?.(data);
      if (saved && typeof saved === 'object') updateData(saved);

      if (currentStep === steps.length - 1) {
        await onComplete?.(saved || data);
        setStatus('complete');
      } else {
        setCurrentStep((stepIndex) => stepIndex + 1);
        setStatus('idle');
      }
      return true;
    } catch (saveError) {
      setStatus('error');
      setError(saveError?.message || 'Unable to save this step');
      return false;
    }
  };

  const goBack = () => {
    setCurrentStep((stepIndex) => Math.max(stepIndex - 1, 0));
    setStatus('idle');
    setError(null);
  };

  const cancel = () => {
    if (storageKey && typeof window !== 'undefined') window.localStorage.removeItem(storageKey);
    setData(initialData);
    setCurrentStep(0);
    setStatus('cancelled');
    setError(null);
  };

  const retry = () => {
    setError(null);
    setStatus('idle');
  };

  return {
    data,
    currentStep,
    status,
    error,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === steps.length - 1,
    updateData,
    goNext,
    goBack,
    cancel,
    retry,
  };
}
