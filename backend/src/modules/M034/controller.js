const service = require('./service');

async function list(req, res) {
  try {
    const result = await service.listItems(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function get(req, res) {
  try {
    const result = await service.getItem(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function create(req, res) {
  try {
    const result = await service.createItem(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function update(req, res) {
  try {
    const result = await service.updateItem(req.params.id, req.body);
    if (!result) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function remove(req, res) {
  try {
    const result = await service.deleteItem(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { list, get, create, update, remove };