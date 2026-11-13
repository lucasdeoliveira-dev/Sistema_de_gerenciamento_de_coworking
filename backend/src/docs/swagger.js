const fs = require('node:fs');
const path = require('node:path');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yaml');

const documento = YAML.parse(fs.readFileSync(path.join(__dirname, 'openapi.yaml'), 'utf8'));

module.exports = [
  helmet.contentSecurityPolicy({ directives: { upgradeInsecureRequests: null } }),
  swaggerUi.serve,
  swaggerUi.setup(documento, { customSiteTitle: 'SGEC — API' }),
];
