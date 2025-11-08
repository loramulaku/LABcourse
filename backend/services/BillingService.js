const BaseService = require('../core/BaseService');
const InvoiceRepository = require('../repositories/InvoiceRepository');
const PaymentRepository = require('../repositories/PaymentRepository');
const TariffRepository = require('../repositories/TariffRepository');
const { InvoiceItem } = require('../models');
const { Op } = require('sequelize');

class BillingService extends BaseService {
  constructor() {
    super();
    this.invoiceRepo = new InvoiceRepository();
    this.paymentRepo = new PaymentRepository();
    this.tariffRepo = new TariffRepository();
  }

  async createInvoice({ patient_id, issuer_id, invoiceable_type = null, invoiceable_id = null, items = [], currency = 'EUR', due_date = null, notes = null }) {
    // compute totals
    const reference = `INV-${Date.now()}-${Math.floor(Math.random()*9000)+1000}`;

    let total = 0;
    const createdInvoice = await this.invoiceRepo.create({ reference, patient_id, issuer_id, invoiceable_type, invoiceable_id, total_amount: 0.0, currency, status: 'draft', due_date, notes });

    for (const it of items) {
      const quantity = it.quantity || 1;
      const unit_price = it.unit_price !== undefined ? it.unit_price : 0.0;
      const lineTotal = parseFloat(unit_price) * parseInt(quantity, 10);
      total += lineTotal;

      await InvoiceItem.create({ invoice_id: createdInvoice.id, description: it.description, tariff_item_id: it.tariff_item_id || null, quantity, unit_price, total: lineTotal });
    }

    // update invoice total
    await this.invoiceRepo.update(createdInvoice.id, { total_amount: total });
    return await this.invoiceRepo.findById(createdInvoice.id, { include: [{ model: require('../models').InvoiceItem, as: 'items' }] });
  }

  async getInvoiceById(id) {
    return await this.invoiceRepo.findById(id, { include: [{ model: require('../models').InvoiceItem, as: 'items' }, { model: require('../models').Payment, as: 'payments' }] });
  }

  async listInvoices(filters = {}) {
    const where = {};
    if (filters.patient_id) where.patient_id = filters.patient_id;
    if (filters.status) where.status = filters.status;
    return await this.invoiceRepo.findAllWithItems(where);
  }

  async recordPayment({ invoice_id, amount, currency = 'EUR', method = 'cash', provider_ref = null, status = 'completed', paid_at = null }) {
    const payment = await this.paymentRepo.create({ invoice_id, amount, currency, method, provider_ref, status, paid_at: paid_at || new Date() });

    // update invoice status: compare cumulative completed payments to invoice total
    const invoice = await this.invoiceRepo.findById(invoice_id);
    if (!invoice) throw new Error('Invoice not found');

    // use models.Payment.sum to get completed payments sum
    const { Payment } = require('../models');
    const completedSum = (await Payment.sum('amount', { where: { invoice_id, status: 'completed' } })) || 0;

    const invoiceTotal = parseFloat(invoice.total_amount || 0);
    if (parseFloat(completedSum) >= invoiceTotal && invoiceTotal > 0) {
      await this.invoiceRepo.update(invoice_id, { status: 'paid' });
    } else if (parseFloat(completedSum) > 0) {
      await this.invoiceRepo.update(invoice_id, { status: 'partially_paid' });
    }

    return payment;
  }
}

module.exports = BillingService;
