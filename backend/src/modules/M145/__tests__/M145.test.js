const m145Service = require('../service');

describe('M145', () => {
  test('should get all items', async () => {
    const result = await m145Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m145Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});