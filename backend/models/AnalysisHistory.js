'use strict';

module.exports = (sequelize, DataTypes) => {
  const AnalysisHistory = sequelize.define('AnalysisHistory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    patient_analysis_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    action_type: {
      type: DataTypes.ENUM('created', 'status_changed', 'result_uploaded', 'result_updated', 'cancelled', 'confirmed'),
      allowNull: false,
    },
    old_status: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    new_status: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    performed_by_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    notes: {
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
  }, {
    tableName: 'analysis_history',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        name: 'idx_analysis_history_pa',
        fields: ['patient_analysis_id'],
      },
    ],
  });

  AnalysisHistory.associate = function(models) {
    AnalysisHistory.belongsTo(models.PatientAnalysis, {
      foreignKey: 'patient_analysis_id',
      onDelete: 'CASCADE',
    });

    AnalysisHistory.belongsTo(models.User, {
      as: 'PerformedBy',
      foreignKey: 'performed_by_user_id',
      onDelete: 'CASCADE',
    });
  };

  return AnalysisHistory;
};

