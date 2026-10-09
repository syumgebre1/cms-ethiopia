const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReportEvidence = sequelize.define(
  'ReportEvidence',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    report_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    uploaded_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    file_url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    file_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    file_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'report_evidence',
  }
);

module.exports = ReportEvidence;