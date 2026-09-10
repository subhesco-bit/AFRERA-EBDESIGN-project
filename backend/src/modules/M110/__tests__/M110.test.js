const m110Service = require('../service');

describe('M110', () => {
  test('should get all items', async () => {
    const result = await m110Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m110Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});