const m206Service = require('../service');

describe('M206', () => {
  test('should get all items', async () => {
    const result = await m206Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m206Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});