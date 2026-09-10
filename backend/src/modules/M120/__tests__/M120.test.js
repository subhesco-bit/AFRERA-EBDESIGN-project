const m120Service = require('../service');

describe('M120', () => {
  test('should get all items', async () => {
    const result = await m120Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m120Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});