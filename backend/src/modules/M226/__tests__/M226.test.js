const m226Service = require('../service');

describe('M226', () => {
  test('should get all items', async () => {
    const result = await m226Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m226Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});