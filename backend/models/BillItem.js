const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class BillItem extends Model {
    static associate(models) {
      // Associations
      this.belongsTo(models.Bill, { foreignKey: 'billId' });
    }
  }

  BillItem.init({
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
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'BillItem',
    tableName: 'bill_items',
    timestamps: true,
    underscored: false
  });

  return BillItem;
};