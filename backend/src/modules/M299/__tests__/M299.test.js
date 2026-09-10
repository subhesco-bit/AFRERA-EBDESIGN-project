const m299Service = require('../service');

describe('M299', () => {
  test('should get all items', async () => {
    const result = await m299Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m299Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});