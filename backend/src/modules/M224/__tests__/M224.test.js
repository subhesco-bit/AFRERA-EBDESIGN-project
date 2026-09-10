const m224Service = require('../service');

describe('M224', () => {
  test('should get all items', async () => {
    const result = await m224Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m224Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});