const m042Service = require('../service');

describe('M042', () => {
  test('should get all items', async () => {
    const result = await m042Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m042Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});