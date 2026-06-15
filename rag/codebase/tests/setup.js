const { sequelize } = require('../src/models');

beforeAll(async () => {
  // Synchronize database and create tables before running tests
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  // Close database connection
  await sequelize.close();
});
