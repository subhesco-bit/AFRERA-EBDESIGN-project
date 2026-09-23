import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';

/**
 * Real backend: backend/src/routes/afreraKernel.js (mounted at
 * /api/v1/afrera-kernel by DynamicRouteLoader), which calls the pine-shadow
 * kernel ported into backend/src/lib/ this session (105/105 Jest tests
 * passing). See frontend/src/pages/kernel/README.md.
 */
export function useKernelGet(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get(`/afrera-kernel${path}`)
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false));
  }, [path]);

  useEffect(() => { reload(); }, [reload]);

  return { data, loading, error, reload };
}

export function useKernelPost() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback((path, body) => {
    setLoading(true);
    setError(null);
    return api.post(`/afrera-kernel${path}`, body)
      .then((res) => { setData(res.data.data); return res.data.data; })
      .catch((err) => { setError(err.response?.data?.error || err.message); throw err; })
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error, run };
}
