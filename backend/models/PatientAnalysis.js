'use strict';

module.exports = (sequelize, DataTypes) => {
  const PatientAnalysis = sequelize.define('PatientAnalysis', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    analysis_type_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    laboratory_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    result: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    result_pdf_path: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    result_note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('unconfirmed', 'confirmed', 'pending_result', 'completed', 'cancelled'),
      defaultValue: 'unconfirmed',
    },
    appointment_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completion_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'patient_analyses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_patient_analyses_user',
        fields: ['user_id'],
      },
      {
        name: 'idx_patient_analyses_analysis_type',
        fields: ['analysis_type_id'],
      },
      {
        name: 'idx_patient_analyses_lab',
        fields: ['laboratory_id'],
      },
    ],
  });

  PatientAnalysis.associate = function(models) {
    PatientAnalysis.belongsTo(models.User, {
      foreignKey: 'user_id',
      onDelete: 'CASCADE',
    });

    PatientAnalysis.belongsTo(models.AnalysisType, {
      foreignKey: 'analysis_type_id',
      onDelete: 'SET NULL',
    });

    PatientAnalysis.belongsTo(models.Laboratory, {
      foreignKey: 'laboratory_id',
      onDelete: 'SET NULL',
    });

    PatientAnalysis.hasMany(models.AnalysisHistory, {
      foreignKey: 'patient_analysis_id',
      onDelete: 'CASCADE',
    });
  };

  return PatientAnalysis;
};

