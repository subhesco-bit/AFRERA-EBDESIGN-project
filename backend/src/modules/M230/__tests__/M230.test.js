const m230Service = require('../service');

describe('M230', () => {
  test('should get all items', async () => {
    const result = await m230Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m230Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});