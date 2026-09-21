import { api, villageProfileAPI } from '../api';

describe('village profile API client', () => {
  afterEach(() => vi.restoreAllMocks());

  test('dashboard search uses the mounted read-only route with query parameters', async () => {
    const response = { data: { success: true, data: [{ id: 41, name: 'Test village' }] } };
    const get = vi.spyOn(api, 'get').mockResolvedValue(response);
    const post = vi.spyOn(api, 'post');
    const params = { district: 'Test district', search: 'rice', limit: 25 };
    await expect(villageProfileAPI.searchVillages(params)).resolves.toBe(response);
    expect(get).toHaveBeenCalledWith('/village-profiles/villages/search', { params });
    expect(post).not.toHaveBeenCalled();
  });

  test('supports the unfiltered dashboard request', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: [] } });
    await villageProfileAPI.searchVillages();
    expect(get).toHaveBeenCalledWith('/village-profiles/villages/search', { params: {} });
  });

  test('propagates failures for the query error state', async () => {
    vi.spyOn(api, 'get').mockRejectedValue(new Error('Database unavailable'));
    await expect(villageProfileAPI.searchVillages()).rejects.toThrow('Database unavailable');
  });
});

describe('API deployment address', () => {
  test('defaults to the current host instead of a visitor localhost', () => {
    expect(api.defaults.baseURL).toBe('/api/v1');
  });

  test('uses a relative deployment-safe API address', () => {
    expect(api.defaults.baseURL).toMatch(/^\//);
  });
});
