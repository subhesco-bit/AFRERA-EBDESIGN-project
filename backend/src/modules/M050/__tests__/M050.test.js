const m050Service = require('../service');

describe('M050', () => {
  test('should get all items', async () => {
    const result = await m050Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m050Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});