const m192Service = require('../service');

describe('M192', () => {
  test('should get all items', async () => {
    const result = await m192Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m192Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});