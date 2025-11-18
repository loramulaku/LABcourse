'use strict';

module.exports = (sequelize, DataTypes) => {
  const OPDVisit = sequelize.define('OPDVisit', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    patient_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    doctor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    visit_type: {
      type: DataTypes.ENUM('consultation', 'followup', 'quick'),
      defaultValue: 'consultation',
    },
    status: {
      type: DataTypes.ENUM('open', 'completed', 'cancelled'),
      defaultValue: 'open',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    consultation_fee: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: true,
    },
    billed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    bill_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    }
  }, {
    tableName: 'opd_visits',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  OPDVisit.associate = function(models) {
    OPDVisit.belongsTo(models.User, {
      foreignKey: 'patient_id',
      as: 'patient'
    });

    OPDVisit.belongsTo(models.Doctor, {
      foreignKey: 'doctor_id',
      as: 'doctor'
    });

    OPDVisit.belongsTo(models.Department, {
      foreignKey: 'department_id',
      as: 'department'
    });

    OPDVisit.belongsTo(models.Bill, {
      foreignKey: 'bill_id',
      as: 'bill'
    });
  };

  return OPDVisit;
};
