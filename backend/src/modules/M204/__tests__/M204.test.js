const m204Service = require('../service');

describe('M204', () => {
  test('should get all items', async () => {
    const result = await m204Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m204Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});