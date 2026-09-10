const m256Service = require('../service');

describe('M256', () => {
  test('should get all items', async () => {
    const result = await m256Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m256Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});