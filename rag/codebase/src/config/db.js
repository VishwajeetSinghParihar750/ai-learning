const { Sequelize } = require('sequelize');
require('dotenv').config();

const isTest = process.env.NODE_ENV === 'test';
const dbUrl = process.env.DATABASE_URL;

let sequelize;

if (isTest && !dbUrl) {
  // Use SQLite in-memory for fast, isolated tests
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  });
} else if (dbUrl) {
  // Use PostgreSQL (or other DB) from DATABASE_URL
  const extraOptions = {};
  if (process.env.NODE_ENV === 'production') {
    extraOptions.ssl = {
      rejectUnauthorized: false, // For hosting providers like Heroku, Render, etc.
    };
  }
  
  sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: extraOptions,
  });
} else {
  // Default to local SQLite file for development
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false,
  });
}

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    // In production, we typically use migrations. For this robust API,
    // we will sync tables. In a real-world scenario we'd run migrations,
    // but sync is safe and clean for portable deployment and testing.
    await sequelize.sync({ alter: false }); 
    console.log(`Database connected successfully using ${sequelize.getDialect()} dialect.`);
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  connectDB,
};
