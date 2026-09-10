const m085Service = require('../service');

describe('M085', () => {
  test('should get all items', async () => {
    const result = await m085Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m085Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});