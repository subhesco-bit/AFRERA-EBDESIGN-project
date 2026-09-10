const m212Service = require('../service');

describe('M212', () => {
  test('should get all items', async () => {
    const result = await m212Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m212Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});