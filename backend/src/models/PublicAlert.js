const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PublicAlert = sequelize.define(
  'PublicAlert',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM(
        'fugitive',
        'missing',
        'wanted',
        'announcement'
      ),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    photo_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    last_seen_location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reward: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'caught', 'found', 'archived'),
      defaultValue: 'active',
    },
    posted_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: 'public_alerts',
  }
);

module.exports = PublicAlert;