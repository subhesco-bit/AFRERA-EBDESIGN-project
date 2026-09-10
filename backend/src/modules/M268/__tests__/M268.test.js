const m268Service = require('../service');

describe('M268', () => {
  test('should get all items', async () => {
    const result = await m268Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m268Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});