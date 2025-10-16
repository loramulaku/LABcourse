'use strict';

module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sent_by_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    notification_type: {
      type: DataTypes.ENUM('result_ready', 'appointment_confirmed', 'appointment_cancelled', 'general_message', 'system_alert'),
      defaultValue: 'general_message',
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    optional_link: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    attachment_path: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  }, {
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_notifications_user',
        fields: ['user_id'],
      },
    ],
  });

  Notification.associate = function(models) {
    Notification.belongsTo(models.User, {
      as: 'Recipient',
      foreignKey: 'user_id',
      onDelete: 'CASCADE',
    });

    Notification.belongsTo(models.User, {
      as: 'Sender',
      foreignKey: 'sent_by_user_id',
      onDelete: 'CASCADE',
    });
  };

  return Notification;
};

