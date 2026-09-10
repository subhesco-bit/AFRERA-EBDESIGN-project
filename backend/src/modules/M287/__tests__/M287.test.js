const m287Service = require('../service');

describe('M287', () => {
  test('should get all items', async () => {
    const result = await m287Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m287Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});