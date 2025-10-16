'use strict';

module.exports = (sequelize, DataTypes) => {
  const MessageSender = sequelize.define('MessageSender', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    message_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sender_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    sender_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  }, {
    tableName: 'message_senders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  });

  MessageSender.associate = function(models) {
    MessageSender.belongsTo(models.Message, {
      foreignKey: 'message_id',
      onDelete: 'CASCADE',
    });
  };

  return MessageSender;
};

