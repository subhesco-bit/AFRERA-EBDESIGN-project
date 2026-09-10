const m148Service = require('../service');

describe('M148', () => {
  test('should get all items', async () => {
    const result = await m148Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m148Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});