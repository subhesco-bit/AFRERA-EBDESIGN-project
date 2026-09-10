const m194Service = require('../service');

describe('M194', () => {
  test('should get all items', async () => {
    const result = await m194Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m194Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});