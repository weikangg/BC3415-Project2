const { getDataConnect, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'default',
  service: 'BC3415-Project2',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

