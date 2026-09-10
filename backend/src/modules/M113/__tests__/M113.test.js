const m113Service = require('../service');

describe('M113', () => {
  test('should get all items', async () => {
    const result = await m113Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m113Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});