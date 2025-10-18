'use strict';

const argon2 = require('argon2');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('user', 'doctor', 'admin', 'lab'),
      allowNull: false,
      defaultValue: 'user',
    },
    account_status: {
      type: DataTypes.ENUM('active', 'pending', 'rejected', 'suspended'),
      defaultValue: 'active',
    },
    verification_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    verified_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_users_role_status',
        fields: ['role', 'account_status'],
      },
      {
        name: 'idx_users_email',
        fields: ['email'],
        unique: true,
      },
    ],
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await argon2.hash(user.password, {
            type: argon2.argon2id,
            memoryCost: 65536, // 64 MB
            timeCost: 3,
            parallelism: 4,
          });
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await argon2.hash(user.password, {
            type: argon2.argon2id,
            memoryCost: 65536,
            timeCost: 3,
            parallelism: 4,
          });
        }
      },
    },
  });

  User.associate = function(models) {
    // Self-reference for verified_by
    User.belongsTo(models.User, {
      as: 'Verifier',
      foreignKey: 'verified_by',
      onDelete: 'SET NULL',
    });

    User.hasOne(models.UserProfile, {
      foreignKey: 'user_id',
      onDelete: 'CASCADE',
    });

    User.hasOne(models.AdminProfile, {
      foreignKey: 'user_id',
      onDelete: 'CASCADE',
    });

    User.hasOne(models.Doctor, {
      foreignKey: 'user_id',
      onDelete: 'CASCADE',
    });

    User.hasOne(models.Laboratory, {
      foreignKey: 'user_id',
      onDelete: 'CASCADE',
    });

    User.hasMany(models.RefreshToken, {
      foreignKey: 'user_id',
      onDelete: 'CASCADE',
    });

    User.hasMany(models.Notification, {
      as: 'ReceivedNotifications',
      foreignKey: 'user_id',
      onDelete: 'CASCADE',
    });

    User.hasMany(models.Notification, {
      as: 'SentNotifications',
      foreignKey: 'sent_by_user_id',
      onDelete: 'CASCADE',
    });

    User.hasMany(models.Message, {
      as: 'SentMessages',
      foreignKey: 'sender_id',
      onDelete: 'CASCADE',
    });

    User.hasMany(models.Message, {
      as: 'ReceivedMessages',
      foreignKey: 'recipient_id',
      onDelete: 'CASCADE',
    });

    User.hasMany(models.PatientAnalysis, {
      foreignKey: 'user_id',
      onDelete: 'CASCADE',
    });

    User.hasMany(models.Appointment, {
      foreignKey: 'user_id',
      onDelete: 'CASCADE',
    });

    User.hasMany(models.DoctorApplication, {
      foreignKey: 'user_id',
      onDelete: 'CASCADE',
    });

    User.hasMany(models.PasswordResetToken, {
      foreignKey: 'user_id',
      onDelete: 'CASCADE',
    });

    User.hasMany(models.AuditLog, {
      as: 'AuditLogs',
      foreignKey: 'user_id',
      onDelete: 'SET NULL',
    });

    User.hasMany(models.AuditLog, {
      as: 'CreatedAuditLogs',
      foreignKey: 'created_by',
      onDelete: 'SET NULL',
    });
  };

  // Instance method to verify password (supports both Argon2 and bcrypt)
  User.prototype.verifyPassword = async function(password) {
    try {
      if (this.password.startsWith('$argon2')) {
        // New Argon2 hash
        return await argon2.verify(this.password, password);
      } else if (this.password.startsWith('$2b$') || this.password.startsWith('$2a$')) {
        // Legacy bcrypt hash
        const bcrypt = require('bcrypt');
        return await bcrypt.compare(password, this.password);
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  // Instance method to get safe user data (without password)
  User.prototype.toSafeObject = function() {
    const { password, ...safeUser } = this.toJSON();
    return safeUser;
  };

  return User;
};

