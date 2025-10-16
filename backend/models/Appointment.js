'use strict';

module.exports = (sequelize, DataTypes) => {
  const Appointment = sequelize.define('Appointment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    doctor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    scheduled_for: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'DECLINED', 'CANCELLED'),
      defaultValue: 'PENDING',
    },
    stripe_session_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    payment_status: {
      type: DataTypes.ENUM('unpaid', 'paid', 'refunded'),
      defaultValue: 'unpaid',
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 20.00,
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'EUR',
    },
  }, {
    tableName: 'appointments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'uniq_doctor_time',
        fields: ['doctor_id', 'scheduled_for'],
        unique: true,
      },
      {
        name: 'idx_appointments_user',
        fields: ['user_id'],
      },
      {
        name: 'idx_appointments_doctor',
        fields: ['doctor_id'],
      },
    ],
  });

  Appointment.associate = function(models) {
    Appointment.belongsTo(models.User, {
      foreignKey: 'user_id',
      onDelete: 'CASCADE',
    });

    Appointment.belongsTo(models.Doctor, {
      foreignKey: 'doctor_id',
      onDelete: 'CASCADE',
    });
  };

  return Appointment;
};

