const m135Service = require('../service');

describe('M135', () => {
  test('should get all items', async () => {
    const result = await m135Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m135Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});