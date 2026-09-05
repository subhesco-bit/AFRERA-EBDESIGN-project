// M001 - Platform Core
const router = require('./routes');

module.exports = { 
  controller: require('./controller'), 
  service: require('./service'),
  router: router
};
