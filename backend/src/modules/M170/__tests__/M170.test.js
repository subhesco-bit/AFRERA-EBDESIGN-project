const m170Service = require('../service');

describe('M170', () => {
  test('should get all items', async () => {
    const result = await m170Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m170Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});