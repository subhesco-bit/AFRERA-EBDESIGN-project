import { api, villageProfileAPI } from '../api';

jest.unmock('../api');

describe('village profile API client', () => {
  afterEach(() => jest.restoreAllMocks());

  test('dashboard search uses the mounted read-only route with query parameters', async () => {
    const response = { data: { success: true, data: [{ id: 41, name: 'Test village' }] } };
    const get = jest.spyOn(api, 'get').mockResolvedValue(response);
    const post = jest.spyOn(api, 'post');
    const params = { district: 'Test district', search: 'rice', limit: 25 };
    await expect(villageProfileAPI.searchVillages(params)).resolves.toBe(response);
    expect(get).toHaveBeenCalledWith('/village-profiles/villages/search', { params });
    expect(post).not.toHaveBeenCalled();
  });

  test('supports the unfiltered dashboard request', async () => {
    const get = jest.spyOn(api, 'get').mockResolvedValue({ data: { data: [] } });
    await villageProfileAPI.searchVillages();
    expect(get).toHaveBeenCalledWith('/village-profiles/villages/search', { params: {} });
  });

  test('propagates failures for the query error state', async () => {
    jest.spyOn(api, 'get').mockRejectedValue(new Error('Database unavailable'));
    await expect(villageProfileAPI.searchVillages()).rejects.toThrow('Database unavailable');
  });
});

describe('API deployment address', () => {
  test('defaults to the current host instead of a visitor localhost', () => {
    const previous = globalThis.__VITE_ENV__.env.VITE_API_BASE_URL;
    try {
      delete globalThis.__VITE_ENV__.env.VITE_API_BASE_URL;
      jest.isolateModules(() => {
        expect(jest.requireActual('../api').api.defaults.baseURL).toBe('/api/v1');
      });
    } finally {
      globalThis.__VITE_ENV__.env.VITE_API_BASE_URL = previous;
    }
  });

  test('preserves explicit deployment configuration', () => {
    expect(api.defaults.baseURL).toBe(globalThis.__VITE_ENV__.env.VITE_API_BASE_URL);
  });
});
