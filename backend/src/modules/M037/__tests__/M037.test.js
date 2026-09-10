const m037Service = require('../service');

describe('M037', () => {
  test('should get all items', async () => {
    const result = await m037Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m037Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});