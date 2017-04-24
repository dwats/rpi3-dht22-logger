const dhtLogger = require('./lib/dht22-logger');
const settings = require('./config.json');
const logger = dhtLogger(settings);
logger.startLogging();
