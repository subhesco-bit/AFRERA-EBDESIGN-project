const m321Service = require('../service');

describe('M321', () => {
  test('should get all items', async () => {
    const result = await m321Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m321Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});