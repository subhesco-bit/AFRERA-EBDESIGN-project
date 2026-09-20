import { useState, useCallback, useRef, useEffect } from 'react';

// Professional Hook with Error Boundaries, Loading States, Retry Logic
export function {HOOK_NAME}(initialState = null) {
  const [state, setState] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;

  const reset = useCallback(() => {
    setState(initialState);
    setError(null);
    retryCountRef.current = 0;
  }, [initialState]);

  const execute = useCallback(async (fn) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      setState(result);
      retryCountRef.current = 0;
      return result;
    } catch (err) {
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current += 1;
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCountRef.current));
        return execute(fn);
      }
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { state, loading, error, reset, execute };
}
