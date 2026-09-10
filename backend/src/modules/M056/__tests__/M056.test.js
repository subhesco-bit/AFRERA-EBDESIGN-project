const m056Service = require('../service');

describe('M056', () => {
  test('should get all items', async () => {
    const result = await m056Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m056Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});