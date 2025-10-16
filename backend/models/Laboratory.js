'use strict';

module.exports = (sequelize, DataTypes) => {
  const Laboratory = sequelize.define('Laboratory', {
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
    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    working_hours: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'laboratories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  Laboratory.associate = function(models) {
    Laboratory.belongsTo(models.User, {
      foreignKey: 'user_id',
      onDelete: 'CASCADE',
    });

    Laboratory.hasMany(models.AnalysisType, {
      foreignKey: 'laboratory_id',
      onDelete: 'SET NULL',
    });

    Laboratory.hasMany(models.PatientAnalysis, {
      foreignKey: 'laboratory_id',
      onDelete: 'SET NULL',
    });
  };

  return Laboratory;
};
