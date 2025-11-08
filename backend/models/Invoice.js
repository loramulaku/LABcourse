'use strict';

module.exports = (sequelize, DataTypes) => {
  const Invoice = sequelize.define('Invoice', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    reference: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    patient_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    issuer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    invoiceable_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    invoiceable_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    total_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'EUR',
    },
    status: {
      type: DataTypes.ENUM('draft', 'issued', 'paid', 'partially_paid', 'cancelled', 'refunded'),
      defaultValue: 'draft',
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'invoices',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  Invoice.associate = function(models) {
    Invoice.belongsTo(models.User, { foreignKey: 'patient_id', as: 'patient' });
    Invoice.belongsTo(models.User, { foreignKey: 'issuer_id', as: 'issuer' });
    Invoice.hasMany(models.InvoiceItem, { foreignKey: 'invoice_id', as: 'items' });
    Invoice.hasMany(models.Payment, { foreignKey: 'invoice_id', as: 'payments' });
  };

  return Invoice;
};
