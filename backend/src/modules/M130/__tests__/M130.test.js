const m130Service = require('../service');

describe('M130', () => {
  test('should get all items', async () => {
    const result = await m130Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m130Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});