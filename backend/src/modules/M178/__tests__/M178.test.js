const m178Service = require('../service');

describe('M178', () => {
  test('should get all items', async () => {
    const result = await m178Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m178Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});