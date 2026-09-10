const m195Service = require('../service');

describe('M195', () => {
  test('should get all items', async () => {
    const result = await m195Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m195Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});