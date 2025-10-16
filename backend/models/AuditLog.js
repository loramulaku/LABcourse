'use strict';

module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    tableName: 'audit_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        name: 'idx_audit_user_action',
        fields: ['user_id', 'action'],
      },
      {
        name: 'idx_audit_created_at',
        fields: ['created_at'],
      },
    ],
  });

  AuditLog.associate = function(models) {
    AuditLog.belongsTo(models.User, {
      as: 'User',
      foreignKey: 'user_id',
      onDelete: 'SET NULL',
    });

    AuditLog.belongsTo(models.User, {
      as: 'Creator',
      foreignKey: 'created_by',
      onDelete: 'SET NULL',
    });
  };

  return AuditLog;
};

