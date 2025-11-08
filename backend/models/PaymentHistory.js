const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class PaymentHistory extends Model {
    static associate(models) {
      // Associations
      this.belongsTo(models.Bill, { foreignKey: 'billId', as: 'bill' });
      this.belongsTo(models.User, { foreignKey: 'receivedBy', as: 'receiver' });
    }
  }

  PaymentHistory.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    billId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'bills',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'card', 'insurance', 'bank_transfer', 'online', 'other'),
      allowNull: false
    },
    transactionRef: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Transaction reference number'
    },
    receivedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    paymentDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'PaymentHistory',
    tableName: 'payment_history',
    timestamps: true,
    underscored: false
  });

  return PaymentHistory;
};
