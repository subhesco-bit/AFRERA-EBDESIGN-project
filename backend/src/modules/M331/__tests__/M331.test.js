const m331Service = require('../service');

describe('M331', () => {
  test('should get all items', async () => {
    const result = await m331Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m331Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});