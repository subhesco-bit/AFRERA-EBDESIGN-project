const m217Service = require('../service');

describe('M217', () => {
  test('should get all items', async () => {
    const result = await m217Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m217Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});