const m335Service = require('../service');

describe('M335', () => {
  test('should get all items', async () => {
    const result = await m335Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m335Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});