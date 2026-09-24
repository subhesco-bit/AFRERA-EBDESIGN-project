/**
 * AFRERA API client — correlation IDs, envelope unwrap, module helpers
 */
(function (global) {
  const cfg = () => global.AFRERA_CONFIG || { apiBase: '/api/v1' };

  async function request(path, options = {}) {
    const url = path.startsWith('http') ? path : `${cfg().apiBase}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Correlation-Id': options.correlationId || crypto.randomUUID?.() || String(Date.now()),
      ...(options.headers || {}),
    };
    const res = await fetch(url, {
      method: options.method || (options.body ? 'POST' : 'GET'),
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const cid = res.headers.get('X-Correlation-Id');
    if (cid && global.AfreraUI) global.AfreraUI.setCorrelation(cid);
    let json;
    try {
      json = await res.json();
    } catch {
      json = { success: false, error: 'invalid_json' };
    }
    if (!res.ok) {
      const err = new Error(json.error || res.statusText);
      err.status = res.status;
      err.payload = json;
      throw err;
    }
    return json.data !== undefined ? { ...json, result: json.data } : json;
  }

  const api = {
    catalogue: () => request('/three-modules/catalogue'),
    health: () => request('/three-modules/health'),
    veterinaryEnhanced: (body) => request('/veterinary-enhanced/enhanced', { body }),
    nutritionEnhanced: (body) => request('/nutrition-enhanced/enhanced', { body }),
    agroEnhanced: (body) => request('/agro-farming/enhanced', { body }),
    unifiedOperate: (body) => request('/unified-intelligence/operate/enhanced', { body }),
    busEvents: () => request('/unified-intelligence/bus/events'),
    financeDashboard: (mod) => request(`/ai-erp/finance/dashboard/${mod}`),
    erpDashboard: (mod) => request(`/ai-erp/erp/dashboard/${mod}`),
    integrateSync: (body) => request('/ai-erp/integrate/sync', { body }),
    interpretOnce: (body) => request('/ai-erp/interpret/once', { body }),
    crops: () => request('/agro-farming/crops'),
  };

  global.AfreraAPI = api;
})(window);
