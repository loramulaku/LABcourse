'use strict';

module.exports = (sequelize, DataTypes) => {
  const Room = sequelize.define('Room', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ward_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    room_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    room_type: {
      type: DataTypes.ENUM(
        'Single',
        'Double',
        'ICU',
        'Maternity',
        'Pediatric',
        'Emergency',
        'General'
      ),
      allowNull: false,
      defaultValue: 'General',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  }, {
    tableName: 'rooms',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_rooms_ward_id',
        fields: ['ward_id'],
      },
    ],
  });

  Room.associate = function(models) {
    Room.belongsTo(models.Ward, {
      foreignKey: 'ward_id',
      as: 'ward',
      onDelete: 'CASCADE',
    });

    Room.hasMany(models.Bed, {
      foreignKey: 'room_id',
      as: 'beds',
      onDelete: 'CASCADE',
    });

    Room.hasMany(models.IPDPatient, {
      foreignKey: 'room_id',
      as: 'ipd_patients',
      onDelete: 'CASCADE',
    });
  };

  return Room;
};
