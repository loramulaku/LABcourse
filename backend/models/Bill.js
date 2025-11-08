const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  console.log('Initializing Bill model...');
  class Bill extends Model {
    static associate(models) {
      // Associations
      this.hasMany(models.BillItem, { foreignKey: 'billId', as: 'items' });
      this.belongsTo(models.User, { foreignKey: 'patientId', as: 'patient' });
      this.belongsTo(models.BillingPackage, { foreignKey: 'packageId', as: 'package' });
      this.hasMany(models.PaymentHistory, { foreignKey: 'billId', as: 'payments' });
    }
  }

  Bill.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    patientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    paidAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    isPaid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'card', 'insurance', 'bank_transfer', 'online', 'other'),
      allowNull: true
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    billType: {
      type: DataTypes.ENUM('consultation', 'treatment', 'lab_test', 'package', 'other'),
      defaultValue: 'other'
    },
    packageId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Bill',
    tableName: 'bills',
    timestamps: true,
    underscored: false
  });

  return Bill;
};