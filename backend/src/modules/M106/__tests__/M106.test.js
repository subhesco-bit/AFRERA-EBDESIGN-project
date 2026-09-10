const m106Service = require('../service');

describe('M106', () => {
  test('should get all items', async () => {
    const result = await m106Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m106Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});