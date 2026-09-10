const m096Service = require('../service');

describe('M096', () => {
  test('should get all items', async () => {
    const result = await m096Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m096Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});