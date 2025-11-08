const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class BillingPackage extends Model {
    static associate(models) {
      // Associations
      this.hasMany(models.Bill, { foreignKey: 'packageId', as: 'bills' });
    }
  }

  BillingPackage.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    packageType: {
      type: DataTypes.ENUM('maternity', 'surgery', 'diagnostic', 'wellness', 'emergency', 'other'),
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duration in days'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    includedServices: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of included services/items'
    }
  }, {
    sequelize,
    modelName: 'BillingPackage',
    tableName: 'billing_packages',
    timestamps: true,
    underscored: false
  });

  return BillingPackage;
};
