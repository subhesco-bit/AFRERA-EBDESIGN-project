const m310Service = require('../service');

describe('M310', () => {
  test('should get all items', async () => {
    const result = await m310Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m310Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});