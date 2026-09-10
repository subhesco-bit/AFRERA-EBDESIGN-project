const m333Service = require('../service');

describe('M333', () => {
  test('should get all items', async () => {
    const result = await m333Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m333Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});