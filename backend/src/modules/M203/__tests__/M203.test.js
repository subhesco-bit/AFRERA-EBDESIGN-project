const m203Service = require('../service');

describe('M203', () => {
  test('should get all items', async () => {
    const result = await m203Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m203Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});