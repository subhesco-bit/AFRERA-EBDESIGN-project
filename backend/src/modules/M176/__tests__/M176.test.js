const m176Service = require('../service');

describe('M176', () => {
  test('should get all items', async () => {
    const result = await m176Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m176Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});