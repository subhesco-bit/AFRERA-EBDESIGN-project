const m338Service = require('../service');

describe('M338', () => {
  test('should get all items', async () => {
    const result = await m338Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m338Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});