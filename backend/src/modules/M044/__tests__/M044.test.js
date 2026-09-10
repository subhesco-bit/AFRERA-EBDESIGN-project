const m044Service = require('../service');

describe('M044', () => {
  test('should get all items', async () => {
    const result = await m044Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m044Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});