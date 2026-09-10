const m218Service = require('../service');

describe('M218', () => {
  test('should get all items', async () => {
    const result = await m218Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m218Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});