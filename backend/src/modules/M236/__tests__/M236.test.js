const m236Service = require('../service');

describe('M236', () => {
  test('should get all items', async () => {
    const result = await m236Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m236Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});