'use strict';

module.exports = (sequelize, DataTypes) => {
  const Doctor = sequelize.define('Doctor', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    image: {
      type: DataTypes.STRING(255),
      defaultValue: '/uploads/avatars/default.png',
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
      type: DataTypes.STRING(20),
      defaultValue: '',
    },
    specialization: {
      type: DataTypes.STRING(255),
      defaultValue: '',
    },
    specializations: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of specializations for this doctor',
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Foreign key to departments table',
    },
    degree: {
      type: DataTypes.STRING(255),
      defaultValue: '',
    },
    license_number: {
      type: DataTypes.STRING(50),
      defaultValue: '',
    },
    experience: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    experience_years: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    about: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    consultation_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    fees: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Deprecated: kept for backward compatibility',
    },
    address_line1: {
      type: DataTypes.STRING(255),
      defaultValue: '',
    },
    address_line2: {
      type: DataTypes.STRING(255),
      defaultValue: '',
    },
    avatar_path: {
      type: DataTypes.STRING(255),
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
    available: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'doctors',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_doctors_user_id',
        fields: ['user_id'],
      },
    ],
  });

  Doctor.associate = function(models) {
    Doctor.belongsTo(models.User, {
      foreignKey: 'user_id',
      onDelete: 'CASCADE',
    });

    Doctor.belongsTo(models.Department, {
      foreignKey: 'department_id',
      allowNull: true,
      as: 'department',
    });

    Doctor.hasMany(models.Appointment, {
      foreignKey: 'doctor_id',
      onDelete: 'CASCADE',
    });
  };

  return Doctor;
};
