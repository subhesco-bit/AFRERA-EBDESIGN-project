const m262Service = require('../service');

describe('M262', () => {
  test('should get all items', async () => {
    const result = await m262Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m262Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});