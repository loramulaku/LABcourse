const db = require('../models');

exports.getBills = async (req, res) => {
  try {
  const bills = await db.Bill.findAll({
      include: [
        { model: db.BillItem, as: 'items' },
          {
            model: db.User, 
            as: 'patient',
            attributes: ['id', 'name', 'email']
          }
      ],
      order: [['createdAt', 'DESC']]
    });

    const enriched = await Promise.all(bills.map(async (bill) => {
      const json = bill.toJSON();
      if (!bill.patient && bill.patientId) {
        try {
          const u = await db.User.findByPk(bill.patientId, { attributes: ['id', 'name', 'email'] });
          if (u) {
            json.patient = u.toJSON();
          }
        } catch (_) {}
      }
      json.patientName = json.patient && json.patient.name ? json.patient.name : 'Unknown';
      return json;
    }));

    res.json({ bills: enriched });
  } catch (error) {
    console.error('Error fetching bills:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    // In development return error details to help debugging
    if (process.env.NODE_ENV !== 'production') {
      return res.status(500).json({ error: error.message, stack: error.stack });
    }
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
};

exports.getBill = async (req, res) => {
  try {
    const bill = await db.Bill.findByPk(req.params.id, {
        include: [
        { model: db.BillItem, as: 'items' },
        {
          model: db.User,
          as: 'patient',
          attributes: ['id', 'name', 'email']
        },
        {
          model: db.PaymentHistory,
          as: 'payments',
          include: [{
            model: db.User,
            as: 'receiver',
            attributes: ['id', 'name']
          }]
        },
        {
          model: db.BillingPackage,
          as: 'package'
        }
      ]
    });

    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    res.json({
  ...bill.toJSON(),
  patientName: bill.patient ? bill.patient.name : 'Unknown'
    });
  } catch (error) {
    console.error('Error fetching bill:', error);
    res.status(500).json({ error: 'Failed to fetch bill' });
  }
};

exports.createBill = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { patientId, items, notes, billType, packageId, paymentMethod, dueDate } = req.body;
    const totalAmount = items.reduce((sum, item) => 
      sum + (parseFloat(item.amount) * parseInt(item.quantity)), 0);

    const bill = await db.Bill.create({
      patientId,
      totalAmount,
      paidAmount: 0,
      notes,
      billType: billType || 'other',
      packageId: packageId || null,
      paymentMethod: paymentMethod || null,
      dueDate: dueDate || null,
      isPaid: false
    }, { transaction });

    await Promise.all(items.map(item => 
      db.BillItem.create({
        billId: bill.id,
        description: item.description,
        quantity: item.quantity,
        amount: item.amount
      }, { transaction })
    ));

    await transaction.commit();

    const completeBill = await db.Bill.findByPk(bill.id, {
      include: [
        { model: db.BillItem, as: 'items' },
        {
          model: db.User,
          as: 'patient',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json(completeBill);
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating bill:', error);
    res.status(500).json({ error: 'Failed to create bill' });
  }
};

exports.markAsPaid = async (req, res) => {
  try {
    const bill = await db.Bill.findByPk(req.params.id);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    await bill.update({ 
      isPaid: true,
      paymentDate: new Date(),
      paidAmount: bill.totalAmount
    });
    res.json({ message: 'Bill marked as paid', bill });
  } catch (error) {
    console.error('Error marking bill as paid:', error);
    res.status(500).json({ error: 'Failed to update bill' });
  }
};

// Add payment to bill (partial or full)
exports.addPayment = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { billId, amount, paymentMethod, transactionRef, notes } = req.body;
    const bill = await db.Bill.findByPk(billId);
    
    if (!bill) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Bill not found' });
    }

    // Create payment history record
    const payment = await db.PaymentHistory.create({
      billId,
      amount,
      paymentMethod,
      transactionRef,
      notes,
      receivedBy: req.user.id,
      paymentDate: new Date()
    }, { transaction });

    // Update bill paid amount
    const newPaidAmount = parseFloat(bill.paidAmount || 0) + parseFloat(amount);
    const isPaid = newPaidAmount >= parseFloat(bill.totalAmount);

    await bill.update({
      paidAmount: newPaidAmount,
      isPaid,
      paymentMethod: paymentMethod,
      paymentDate: isPaid ? new Date() : bill.paymentDate
    }, { transaction });

    await transaction.commit();

    const updatedBill = await db.Bill.findByPk(billId, {
      include: [
        { model: db.BillItem, as: 'items' },
        { model: db.PaymentHistory, as: 'payments' }
      ]
    });

    res.json({ 
      message: 'Payment added successfully', 
      payment,
      bill: updatedBill
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error adding payment:', error);
    res.status(500).json({ error: 'Failed to add payment' });
  }
};

// Get payment history for a bill
exports.getPaymentHistory = async (req, res) => {
  try {
    const payments = await db.PaymentHistory.findAll({
      where: { billId: req.params.id },
      include: [{
        model: db.User,
        as: 'receiver',
        attributes: ['id', 'name']
      }],
      order: [['paymentDate', 'DESC']]
    });
    res.json({ payments });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
};

// Backwards-compatibility alias: some callers expect getAllBills
exports.getAllBills = exports.getBills;

// Merge legacy Bills and OOP Invoices for a unified admin list
exports.getSystemBills = async (req, res) => {
  try {
    const [bills, invoices] = await Promise.all([
      db.Bill.findAll({
        include: [
          { model: db.BillItem, as: 'items' },
          { model: db.User, as: 'patient', attributes: ['id', 'name', 'email'] }
        ],
        order: [['createdAt', 'DESC']]
      }),
      db.Invoice.findAll({
        include: [
          { model: db.InvoiceItem, as: 'items' },
          { model: db.Payment, as: 'payments' },
          { model: db.User, as: 'patient', attributes: ['id', 'name', 'email'] }
        ],
        order: [['created_at', 'DESC']]
      })
    ]);

    const mapBills = bills.map(b => {
      const json = b.toJSON();
      const patientName = json.patient?.name || 'Unknown';
      const paidAmount = parseFloat(json.paidAmount || 0);
      return {
        id: json.id,
        source: 'bill',
        patientName,
        createdAt: json.createdAt,
        totalAmount: parseFloat(json.totalAmount || 0),
        paidAmount,
        isPaid: !!json.isPaid,
        billType: json.billType || 'other'
      };
    });

    const mapInvoices = invoices.map(inv => {
      const json = inv.toJSON();
      const patientName = json.patient?.name || 'Unknown';
      const payments = Array.isArray(json.payments) ? json.payments : [];
      const paidAmount = payments.reduce((sum, p) => sum + (p.status === 'completed' ? parseFloat(p.amount || 0) : 0), 0);
      const isPaid = json.status === 'paid';
      return {
        id: json.id,
        source: 'invoice',
        patientName,
        createdAt: json.created_at,
        totalAmount: parseFloat(json.total_amount || 0),
        paidAmount,
        isPaid,
        billType: 'invoice'
      };
    });

    res.json({ bills: [...mapBills, ...mapInvoices] });
  } catch (error) {
    console.error('Error fetching system bills:', error);
    res.status(500).json({ error: 'Failed to fetch system bills' });
  }
};