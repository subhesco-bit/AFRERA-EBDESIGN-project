const m109Service = require('../service');

describe('M109', () => {
  test('should get all items', async () => {
    const result = await m109Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m109Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});