'use strict';

module.exports = (sequelize, DataTypes) => {
  const DoctorApplication = sequelize.define('DoctorApplication', {
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
    license_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    medical_field: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    specialization: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    experience_years: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    education: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    previous_clinic: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    license_upload_path: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    cv_upload_path: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    additional_documents: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reviewed_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'doctor_applications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  DoctorApplication.associate = function(models) {
    DoctorApplication.belongsTo(models.User, {
      foreignKey: 'user_id',
      onDelete: 'CASCADE',
    });

    DoctorApplication.belongsTo(models.User, {
      as: 'Reviewer',
      foreignKey: 'reviewed_by',
      onDelete: 'SET NULL',
    });
  };

  return DoctorApplication;
};

