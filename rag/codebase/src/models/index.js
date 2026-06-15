const { sequelize } = require('../config/db');
const User = require('./User');
const Task = require('./Task');

module.exports = {
  sequelize,
  User,
  Task,
};
