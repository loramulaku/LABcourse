'use strict';

module.exports = (sequelize, DataTypes) => {
  const DailyDoctorNote = sequelize.define('DailyDoctorNote', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ipd_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    doctor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  }, {
    tableName: 'daily_doctor_notes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_daily_doctor_notes_ipd_id',
        fields: ['ipd_id'],
      },
    ],
  });

  DailyDoctorNote.associate = function(models) {
    DailyDoctorNote.belongsTo(models.IPDPatient, {
      foreignKey: 'ipd_id',
      as: 'ipd_patient',
      onDelete: 'CASCADE',
    });

    DailyDoctorNote.belongsTo(models.Doctor, {
      foreignKey: 'doctor_id',
      as: 'doctor',
      onDelete: 'CASCADE',
    });
  };

  return DailyDoctorNote;
};
