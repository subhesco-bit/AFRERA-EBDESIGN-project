const db = require('../database/dbConnection');
const logger = require('../utils/logger');
class VRService {
  async createVRSpace(spaceData) {
    try { const id = require('uuid').v4(); await db('vr_spaces').insert({ id, space_name: spaceData.name, space_data: JSON.stringify(spaceData), created_at: new Date() }); return { space_id: id, name: spaceData.name, status: 'active' }; }
    catch (error) { logger.error('Create VR failed'); throw error; }
  }
}
module.exports = new VRService();
