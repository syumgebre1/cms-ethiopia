const sequelize = require('../config/database');
const User = require('./User');
const Report = require('./Report');

// One User can submit many Reports
User.hasMany(Report, {
  foreignKey: 'user_id',
  as: 'reports',
});

// Each Report belongs to one User (the reporter)
Report.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'reporter',
});

module.exports = { sequelize, User, Report };