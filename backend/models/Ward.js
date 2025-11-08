'use strict';

module.exports = (sequelize, DataTypes) => {
  const Ward = sequelize.define('Ward', {
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
    total_beds: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  }, {
    tableName: 'wards',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  Ward.associate = function(models) {
    Ward.hasMany(models.Room, {
      foreignKey: 'ward_id',
      as: 'rooms',
      onDelete: 'CASCADE',
    });

    Ward.hasMany(models.IPDPatient, {
      foreignKey: 'ward_id',
      as: 'ipd_patients',
      onDelete: 'CASCADE',
    });

    Ward.hasMany(models.AdmissionRequest, {
      foreignKey: 'recommended_ward_id',
      as: 'admission_requests',
      onDelete: 'SET NULL',
    });
  };

  return Ward;
};
