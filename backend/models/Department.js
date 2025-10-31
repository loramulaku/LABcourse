'use strict';

module.exports = (sequelize, DataTypes) => {
  const Department = sequelize.define('Department', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    head_doctor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID of the doctor who heads this department',
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    budget: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: 'Annual budget for the department',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    specializations: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of specializations for this department',
    },
  }, {
    tableName: 'departments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_departments_name',
        fields: ['name'],
      },
      {
        name: 'idx_departments_is_active',
        fields: ['is_active'],
      },
    ],
  });

  Department.associate = function(models) {
    Department.hasMany(models.Doctor, {
      foreignKey: 'department_id',
      onDelete: 'SET NULL',
      as: 'doctors',
    });

    Department.belongsTo(models.Doctor, {
      foreignKey: 'head_doctor_id',
      allowNull: true,
      as: 'headDoctor',
    });
  };

  return Department;
};
