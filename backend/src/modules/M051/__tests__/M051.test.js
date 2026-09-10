const m051Service = require('../service');

describe('M051', () => {
  test('should get all items', async () => {
    const result = await m051Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m051Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});