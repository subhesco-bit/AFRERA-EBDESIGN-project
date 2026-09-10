const m181Service = require('../service');

describe('M181', () => {
  test('should get all items', async () => {
    const result = await m181Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m181Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});