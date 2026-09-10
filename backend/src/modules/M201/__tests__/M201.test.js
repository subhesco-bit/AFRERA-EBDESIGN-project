const m201Service = require('../service');

describe('M201', () => {
  test('should get all items', async () => {
    const result = await m201Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m201Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});