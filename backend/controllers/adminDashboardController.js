const { User, Doctor, Appointment, Payment, Sequelize } = require('../models');
const { Op } = Sequelize;

exports.getDashboardStats = async (req, res) => {
  try {
    // 1. KPIs
    const totalPatients = await User.count({ where: { role: 'patient' } });
    const totalDoctors = await Doctor.count({
      include: [{ model: User, where: { account_status: 'active' } }]
    });
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const totalAppointments = await Appointment.count();
    const monthlyAppointments = await Appointment.count({
      where: {
        appointment_date: {
          [Op.gte]: startOfMonth
        }
      }
    });

    // Calculate total revenue (completed payments)
    const totalRevenueResult = await Payment.sum('amount', {
      where: { status: 'completed' }
    });
    const totalRevenue = totalRevenueResult || 0;

    // 2. Appointments by Status (for Donut Chart)
    const appointmentsByStatus = await Appointment.findAll({
      attributes: ['status', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
      group: ['status']
    });

    const statusData = {
      Pending: 0,
      Confirmed: 0,
      Completed: 0,
      Cancelled: 0
    };

    appointmentsByStatus.forEach(stat => {
      const status = stat.getDataValue('status');
      const count = parseInt(stat.getDataValue('count'), 10);
      
      // Map statuses or just capitalize
      if (status === 'PENDING') statusData.Pending = count;
      if (status === 'CONFIRMED' || status === 'APPROVED') statusData.Confirmed += count;
      if (status === 'COMPLETED') statusData.Completed = count;
      if (status === 'CANCELLED' || status === 'REJECTED') statusData.Cancelled += count;
    });

    // 3. Revenue by Month (for Area/Line Chart)
    // We get all payments for the current year
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const paymentsThisYear = await Payment.findAll({
      where: { 
        status: 'completed',
        paid_at: { [Op.gte]: startOfYear }
      },
      attributes: [
        [Sequelize.fn('MONTH', Sequelize.col('paid_at')), 'month'],
        [Sequelize.fn('SUM', Sequelize.col('amount')), 'total']
      ],
      group: [Sequelize.fn('MONTH', Sequelize.col('paid_at'))],
      raw: true
    });

    const monthlyRevenue = new Array(12).fill(0);
    paymentsThisYear.forEach(p => {
      // MONTH in MySQL returns 1-12
      const monthIndex = parseInt(p.month, 10) - 1;
      monthlyRevenue[monthIndex] = parseFloat(p.total);
    });

    // 4. Recent Appointments (for Table)
    const recentAppointments = await Appointment.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [
        { model: User, attributes: ['id', 'name', 'email'] },
        { 
          model: Doctor, 
          include: [{ model: User, attributes: ['name'] }]
        }
      ]
    });

    res.json({
      success: true,
      data: {
        kpis: {
          totalPatients,
          totalDoctors,
          totalAppointments,
          monthlyAppointments,
          totalRevenue
        },
        charts: {
          appointmentsByStatus: [
            statusData.Pending, 
            statusData.Confirmed, 
            statusData.Completed, 
            statusData.Cancelled
          ],
          revenueByMonth: monthlyRevenue
        },
        recentActivity: recentAppointments
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard statistics' });
  }
};
