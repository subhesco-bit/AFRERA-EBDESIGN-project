const m150Service = require('../service');

describe('M150', () => {
  test('should get all items', async () => {
    const result = await m150Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m150Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});