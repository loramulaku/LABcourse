'use strict';

module.exports = (sequelize, DataTypes) => {
  const Bed = sequelize.define('Bed', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    room_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    bed_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Available', 'Occupied', 'Reserved', 'Cleaning', 'Maintenance'),
      allowNull: false,
      defaultValue: 'Available',
    },
  }, {
    tableName: 'beds',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_beds_room_id',
        fields: ['room_id'],
      },
      {
        name: 'idx_beds_status',
        fields: ['status'],
      },
    ],
  });

  Bed.associate = function(models) {
    Bed.belongsTo(models.Room, {
      foreignKey: 'room_id',
      as: 'room',
      onDelete: 'CASCADE',
    });

    Bed.hasMany(models.IPDPatient, {
      foreignKey: 'bed_id',
      as: 'ipd_patients',
      onDelete: 'CASCADE',
    });
  };

  return Bed;
};
