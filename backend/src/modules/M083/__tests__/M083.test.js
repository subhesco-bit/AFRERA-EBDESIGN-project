const m083Service = require('../service');

describe('M083', () => {
  test('should get all items', async () => {
    const result = await m083Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m083Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});