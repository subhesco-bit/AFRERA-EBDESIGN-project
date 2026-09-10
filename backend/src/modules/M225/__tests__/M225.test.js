const m225Service = require('../service');

describe('M225', () => {
  test('should get all items', async () => {
    const result = await m225Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m225Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});