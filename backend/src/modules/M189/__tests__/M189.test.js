const m189Service = require('../service');

describe('M189', () => {
  test('should get all items', async () => {
    const result = await m189Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m189Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});