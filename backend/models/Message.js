'use strict';

module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    recipient_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    message_type: {
      type: DataTypes.ENUM('broadcast', 'individual', 'group'),
      defaultValue: 'individual',
    },
    attachment_path: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    tableName: 'messages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_messages_sender',
        fields: ['sender_id'],
      },
      {
        name: 'idx_messages_recipient',
        fields: ['recipient_id'],
      },
    ],
  });

  Message.associate = function(models) {
    Message.belongsTo(models.User, {
      as: 'Sender',
      foreignKey: 'sender_id',
      onDelete: 'CASCADE',
    });

    Message.belongsTo(models.User, {
      as: 'Recipient',
      foreignKey: 'recipient_id',
      onDelete: 'CASCADE',
    });

    Message.hasMany(models.MessageSender, {
      foreignKey: 'message_id',
      onDelete: 'CASCADE',
    });

    Message.hasMany(models.ContactMessageRedirect, {
      foreignKey: 'original_message_id',
      onDelete: 'CASCADE',
    });
  };

  return Message;
};

