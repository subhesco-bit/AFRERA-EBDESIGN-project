window.AFRERA_CONFIG = {
  apiBase: window.location.origin.includes('localhost')
    ? 'http://localhost:3000/api/v1'
    : '/api/v1',
  modules: [
    { id: 'home', title: 'Home', path: '#/' },
    { id: 'disease', title: 'Disease AI', path: '#/disease', accent: '#b91c1c' },
    { id: 'veterinary', title: 'Veterinary', path: '#/veterinary', accent: '#0f766e' },
    { id: 'nutrition', title: 'Nutrition', path: '#/nutrition', accent: '#b45309' },
    { id: 'agro', title: 'Agro', path: '#/agro', accent: '#166534' },
    { id: 'unified', title: 'Unified OS', path: '#/unified', accent: '#1e3a8a' },
    { id: 'erp', title: 'ERP & GST', path: '#/erp', accent: '#6b21a8' },
    { id: 'bus', title: 'Inter-module bus', path: '#/bus', accent: '#334155' },
  ],
};
