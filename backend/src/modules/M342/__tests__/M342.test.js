const m342Service = require('../service');

describe('M342', () => {
  test('should get all items', async () => {
    const result = await m342Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m342Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});