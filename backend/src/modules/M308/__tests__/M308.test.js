const m308Service = require('../service');

describe('M308', () => {
  test('should get all items', async () => {
    const result = await m308Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m308Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});