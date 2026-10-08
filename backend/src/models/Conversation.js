const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Conversation = sequelize.define(
  'Conversation',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user1_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    user2_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    last_message_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'conversations',
    indexes: [
      {
        unique: true,
        fields: ['user1_id', 'user2_id'],
      },
    ],
  }
);

module.exports = Conversation;