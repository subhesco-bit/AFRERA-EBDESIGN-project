const m281Service = require('../service');

describe('M281', () => {
  test('should get all items', async () => {
    const result = await m281Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m281Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});