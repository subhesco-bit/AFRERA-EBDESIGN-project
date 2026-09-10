const m239Service = require('../service');

describe('M239', () => {
  test('should get all items', async () => {
    const result = await m239Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m239Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});