const m313Service = require('../service');

describe('M313', () => {
  test('should get all items', async () => {
    const result = await m313Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m313Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});