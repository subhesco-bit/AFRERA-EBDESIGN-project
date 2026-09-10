const m048Service = require('../service');

describe('M048', () => {
  test('should get all items', async () => {
    const result = await m048Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m048Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});