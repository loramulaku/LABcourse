const BaseController = require('../../core/BaseController');
const BillingService = require('../../services/BillingService');
const { AppError } = require('../../core/errors');

class BillingController extends BaseController {
  constructor() {
    super();
    this.billingService = new BillingService();
    this.bindMethods();
  }

  async createInvoice(req, res) {
    try {
      const payload = req.body;
      const invoice = await this.billingService.createInvoice(payload);
      return this.created(res, { data: invoice, message: 'Invoice created' });
    } catch (error) {
      if (error instanceof AppError) return this.error(res, error, error.statusCode);
      return this.error(res, error);
    }
  }

  async getInvoice(req, res) {
    try {
      const invoice = await this.billingService.getInvoiceById(req.params.id);
      if (!invoice) return this.notFound(res, 'Invoice not found');
      return this.success(res, { data: invoice });
    } catch (error) {
      if (error instanceof AppError) return this.error(res, error, error.statusCode);
      return this.error(res, error);
    }
  }

  async listInvoices(req, res) {
    try {
      const filters = { patient_id: req.query.patient_id, status: req.query.status };
      const invoices = await this.billingService.listInvoices(filters);
      return this.success(res, { data: invoices, count: invoices.length });
    } catch (error) {
      if (error instanceof AppError) return this.error(res, error, error.statusCode);
      return this.error(res, error);
    }
  }

  async recordPayment(req, res) {
    try {
      const payload = req.body;
      const payment = await this.billingService.recordPayment(payload);
      return this.success(res, { data: payment, message: 'Payment recorded' });
    } catch (error) {
      if (error instanceof AppError) return this.error(res, error, error.statusCode);
      return this.error(res, error);
    }
  }
}

module.exports = BillingController;
