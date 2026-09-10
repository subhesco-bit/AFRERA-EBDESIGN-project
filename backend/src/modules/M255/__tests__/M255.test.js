const m255Service = require('../service');

describe('M255', () => {
  test('should get all items', async () => {
    const result = await m255Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m255Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});