const m136Service = require('../service');

describe('M136', () => {
  test('should get all items', async () => {
    const result = await m136Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m136Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});