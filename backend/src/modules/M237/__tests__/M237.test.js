const m237Service = require('../service');

describe('M237', () => {
  test('should get all items', async () => {
    const result = await m237Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m237Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});