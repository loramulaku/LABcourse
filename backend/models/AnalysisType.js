'use strict';

module.exports = (sequelize, DataTypes) => {
  const AnalysisType = sequelize.define('AnalysisType', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    normal_range: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
    },
    laboratory_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    tableName: 'analysis_types',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_analysis_types_lab_id',
        fields: ['laboratory_id'],
      },
    ],
  });

  AnalysisType.associate = function(models) {
    AnalysisType.belongsTo(models.Laboratory, {
      foreignKey: 'laboratory_id',
      onDelete: 'SET NULL',
    });

    AnalysisType.hasMany(models.PatientAnalysis, {
      foreignKey: 'analysis_type_id',
      onDelete: 'SET NULL',
    });
  };

  return AnalysisType;
};

