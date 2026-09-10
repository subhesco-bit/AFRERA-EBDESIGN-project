const m102Service = require('../service');

describe('M102', () => {
  test('should get all items', async () => {
    const result = await m102Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m102Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});