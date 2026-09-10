const m162Service = require('../service');

describe('M162', () => {
  test('should get all items', async () => {
    const result = await m162Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m162Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});