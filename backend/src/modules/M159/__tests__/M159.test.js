const m159Service = require('../service');

describe('M159', () => {
  test('should get all items', async () => {
    const result = await m159Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m159Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});