const m327Service = require('../service');

describe('M327', () => {
  test('should get all items', async () => {
    const result = await m327Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m327Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});