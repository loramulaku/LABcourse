'use strict';

module.exports = (sequelize, DataTypes) => {
  const InvoiceItem = sequelize.define('InvoiceItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    invoice_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    tariff_item_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    unit_price: {
      type: DataTypes.DECIMAL(12,2),
      defaultValue: 0.0,
    },
    total: {
      type: DataTypes.DECIMAL(12,2),
      defaultValue: 0.0,
    },
  }, {
    tableName: 'invoice_items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  InvoiceItem.associate = function(models) {
    InvoiceItem.belongsTo(models.Invoice, { foreignKey: 'invoice_id', as: 'invoice' });
  };

  return InvoiceItem;
};
