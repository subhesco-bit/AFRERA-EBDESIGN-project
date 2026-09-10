const m121Service = require('../service');

describe('M121', () => {
  test('should get all items', async () => {
    const result = await m121Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m121Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});