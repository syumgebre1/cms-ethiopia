const sequelize = require('../config/database');
const User = require('./User');
const Report = require('./Report');
const Conversation = require('./Conversation');
const Message = require('./Message');
const PublicAlert = require('./PublicAlert');
const Notification = require('./Notification');
const ReportEvidence = require('./ReportEvidence');

// User ↔ Report
User.hasMany(Report, { foreignKey: 'user_id', as: 'reports' });
Report.belongsTo(User, { foreignKey: 'user_id', as: 'reporter' });

// User ↔ Conversation
User.hasMany(Conversation, { foreignKey: 'user1_id', as: 'conversationsAsUser1' });
User.hasMany(Conversation, { foreignKey: 'user2_id', as: 'conversationsAsUser2' });
Conversation.belongsTo(User, { foreignKey: 'user1_id', as: 'user1' });
Conversation.belongsTo(User, { foreignKey: 'user2_id', as: 'user2' });

// Conversation ↔ Message
Conversation.hasMany(Message, {
  foreignKey: 'conversation_id',
  as: 'messages',
  onDelete: 'CASCADE',
});
Message.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'conversation' });
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

// User ↔ PublicAlert
User.hasMany(PublicAlert, { foreignKey: 'posted_by', as: 'publicAlerts' });
PublicAlert.belongsTo(User, { foreignKey: 'posted_by', as: 'poster' });

// User ↔ Notification
User.hasMany(Notification, {
  foreignKey: 'user_id',
  as: 'notifications',
  onDelete: 'CASCADE',
});
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Report ↔ ReportEvidence
Report.hasMany(ReportEvidence, {
  foreignKey: 'report_id',
  as: 'evidence',
  onDelete: 'CASCADE',
});
ReportEvidence.belongsTo(Report, { foreignKey: 'report_id', as: 'report' });
ReportEvidence.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });

module.exports = {
  sequelize,
  User,
  Report,
  Conversation,
  Message,
  PublicAlert,
  Notification,
  ReportEvidence,
};