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
    { id: 'enterprise', title: 'Enterprise', path: '#/enterprise', accent: '#0f172a' },
    { id: 'ecommerce', title: 'Ecommerce', path: '#/ecommerce', accent: '#c2410c' },
    { id: 'insurance', title: 'Insurance', path: '#/insurance', accent: '#1d4ed8' },
    { id: 'finance', title: 'Finance', path: '#/finance', accent: '#047857' },
    { id: 'cold', title: 'Cold Storage', path: '#/cold-storage', accent: '#0284c7' },
    { id: 'rental', title: 'Rental', path: '#/rental', accent: '#a16207' },
    { id: 'erp', title: 'ERP & GST', path: '#/erp', accent: '#6b21a8' },
    { id: 'unified', title: 'Unified OS', path: '#/unified', accent: '#1e3a8a' },
    { id: 'bus', title: 'Inter-module bus', path: '#/bus', accent: '#334155' },
  ],
};
