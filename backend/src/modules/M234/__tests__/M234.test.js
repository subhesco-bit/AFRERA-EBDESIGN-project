const m234Service = require('../service');

describe('M234', () => {
  test('should get all items', async () => {
    const result = await m234Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m234Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});