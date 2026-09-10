const m211Service = require('../service');

describe('M211', () => {
  test('should get all items', async () => {
    const result = await m211Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m211Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});