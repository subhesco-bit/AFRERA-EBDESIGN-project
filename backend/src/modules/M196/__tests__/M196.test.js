const m196Service = require('../service');

describe('M196', () => {
  test('should get all items', async () => {
    const result = await m196Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m196Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});