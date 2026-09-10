const m075Service = require('../service');

describe('M075', () => {
  test('should get all items', async () => {
    const result = await m075Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m075Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});