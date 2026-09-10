const m071Service = require('../service');

describe('M071', () => {
  test('should get all items', async () => {
    const result = await m071Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m071Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});