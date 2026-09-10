const m326Service = require('../service');

describe('M326', () => {
  test('should get all items', async () => {
    const result = await m326Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m326Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});