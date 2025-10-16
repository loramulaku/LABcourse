'use strict';

module.exports = (sequelize, DataTypes) => {
  const ContactMessageRedirect = sequelize.define('ContactMessageRedirect', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    original_message_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    redirected_to_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    redirected_by_admin_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    redirect_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'responded', 'closed'),
      defaultValue: 'pending',
    },
  }, {
    tableName: 'contact_message_redirects',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_redirects_original',
        fields: ['original_message_id'],
      },
      {
        name: 'idx_redirects_recipient',
        fields: ['redirected_to_user_id'],
      },
    ],
  });

  ContactMessageRedirect.associate = function(models) {
    ContactMessageRedirect.belongsTo(models.Message, {
      as: 'OriginalMessage',
      foreignKey: 'original_message_id',
      onDelete: 'CASCADE',
    });

    ContactMessageRedirect.belongsTo(models.User, {
      as: 'RedirectedTo',
      foreignKey: 'redirected_to_user_id',
      onDelete: 'CASCADE',
    });

    ContactMessageRedirect.belongsTo(models.User, {
      as: 'RedirectedBy',
      foreignKey: 'redirected_by_admin_id',
      onDelete: 'CASCADE',
    });
  };

  return ContactMessageRedirect;
};

