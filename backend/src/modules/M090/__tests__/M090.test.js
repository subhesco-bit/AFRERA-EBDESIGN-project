const m090Service = require('../service');

describe('M090', () => {
  test('should get all items', async () => {
    const result = await m090Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m090Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});