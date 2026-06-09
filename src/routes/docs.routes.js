const { Router } = require('express');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const openApiPath = path.join(__dirname, '../../docs/openapi.yaml');
const openApiDocument = YAML.load(openApiPath);

const router = Router();

router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(openApiDocument, { explorer: true }));
router.get('/openapi.yaml', (req, res) => {
  res.sendFile(openApiPath);
});

module.exports = router;
