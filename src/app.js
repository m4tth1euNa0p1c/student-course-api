const express = require('express');
const swaggerUi = require('swagger-ui-express');

const x = require('./routes/students');
const y = require('./routes/courses');
const z = require('../swagger.json');

const app = express();
app.use(express.json());

// Configure Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(z));

const storage = require('./services/storage');

storage.seed();

app.use('/students', x);
app.use('/courses', y);

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

if (require.main === module) {
  const p = process.env.PORT || 3000;
  app.listen(p, () => {
    console.log(`Server listening on port ${p}`);
  });
}

module.exports = app;
