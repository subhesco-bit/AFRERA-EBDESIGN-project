const m238Service = require('../service');

describe('M238', () => {
  test('should get all items', async () => {
    const result = await m238Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m238Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});