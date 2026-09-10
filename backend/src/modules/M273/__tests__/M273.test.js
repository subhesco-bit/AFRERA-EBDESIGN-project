const m273Service = require('../service');

describe('M273', () => {
  test('should get all items', async () => {
    const result = await m273Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m273Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});