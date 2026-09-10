const m344Service = require('../service');

describe('M344', () => {
  test('should get all items', async () => {
    const result = await m344Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m344Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});