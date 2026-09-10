const m306Service = require('../service');

describe('M306', () => {
  test('should get all items', async () => {
    const result = await m306Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m306Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});