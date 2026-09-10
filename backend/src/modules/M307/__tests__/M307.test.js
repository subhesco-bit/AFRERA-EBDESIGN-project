const m307Service = require('../service');

describe('M307', () => {
  test('should get all items', async () => {
    const result = await m307Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m307Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});