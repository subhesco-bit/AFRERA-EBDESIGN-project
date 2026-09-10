const m244Service = require('../service');

describe('M244', () => {
  test('should get all items', async () => {
    const result = await m244Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m244Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});