const m060Service = require('../service');

describe('M060', () => {
  test('should get all items', async () => {
    const result = await m060Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m060Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});