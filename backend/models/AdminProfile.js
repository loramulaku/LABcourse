'use strict';

module.exports = (sequelize, DataTypes) => {
  const AdminProfile = sequelize.define('AdminProfile', {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    first_name: {
      type: DataTypes.STRING(100),
      defaultValue: '',
    },
    last_name: {
      type: DataTypes.STRING(100),
      defaultValue: '',
    },
    phone: {
      type: DataTypes.STRING(30),
      defaultValue: '',
    },
    bio: {
      type: DataTypes.STRING(255),
      defaultValue: '',
    },
    avatar_path: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: '/uploads/avatars/default.png',
    },
    facebook: {
      type: DataTypes.STRING(255),
      defaultValue: '',
    },
    x: {
      type: DataTypes.STRING(255),
      defaultValue: '',
    },
    linkedin: {
      type: DataTypes.STRING(255),
      defaultValue: '',
    },
    instagram: {
      type: DataTypes.STRING(255),
      defaultValue: '',
    },
    country: {
      type: DataTypes.STRING(100),
      defaultValue: '',
    },
    city_state: {
      type: DataTypes.STRING(150),
      defaultValue: '',
    },
    postal_code: {
      type: DataTypes.STRING(50),
      defaultValue: '',
    },
    tax_id: {
      type: DataTypes.STRING(100),
      defaultValue: '',
    },
  }, {
    tableName: 'admin_profiles',
    timestamps: true,
    createdAt: false,
    updatedAt: 'updated_at',
  });

  AdminProfile.associate = function(models) {
    AdminProfile.belongsTo(models.User, {
      foreignKey: 'user_id',
      onDelete: 'CASCADE',
    });
  };

  return AdminProfile;
};

