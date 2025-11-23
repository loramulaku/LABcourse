const { Therapy, Appointment, Doctor, User, Notification } = require('../models');
const { Op } = require('sequelize');

// Helper: get current doctor ID from user
const getCurrentDoctorId = async (userId) => {
  const doctor = await Doctor.findOne({
    where: { user_id: userId },
    attributes: ['id']
  });
  return doctor ? doctor.id : null;
};

// Get all therapies for current doctor
exports.getDashboard = async (req, res) => {
  try {
    const doctorId = await getCurrentDoctorId(req.user.id);
    if (!doctorId) return res.json([]);

    const therapies = await Therapy.findAll({
      where: { doctor_id: doctorId },
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Appointment,
          as: 'appointment',
          required: false
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(therapies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get therapy statistics for current doctor
exports.getStats = async (req, res) => {
  try {
    const doctorId = await getCurrentDoctorId(req.user.id);
    if (!doctorId) {
      return res.json({
        total_therapies: 0,
        active_therapies: 0,
        completed_therapies: 0,
        cancelled_therapies: 0,
      });
    }

    const [total, active, completed, cancelled] = await Promise.all([
      Therapy.count({ where: { doctor_id: doctorId } }),
      Therapy.count({ where: { doctor_id: doctorId, status: 'active' } }),
      Therapy.count({ where: { doctor_id: doctorId, status: 'completed' } }),
      Therapy.count({ where: { doctor_id: doctorId, status: 'cancelled' } })
    ]);

    res.json({
      total_therapies: total,
      active_therapies: active,
      completed_therapies: completed,
      cancelled_therapies: cancelled,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get upcoming follow-ups for current doctor
exports.getUpcomingFollowUps = async (req, res) => {
  try {
    const doctorId = await getCurrentDoctorId(req.user.id);
    if (!doctorId) return res.json([]);

    const followUps = await Therapy.findAll({
      where: {
        doctor_id: doctorId,
        follow_up_date: {
          [Op.gte]: new Date()
        }
      },
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['follow_up_date', 'ASC']],
      limit: 10
    });

    res.json(followUps);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get therapies by status
exports.getByStatus = async (req, res) => {
  try {
    const doctorId = await getCurrentDoctorId(req.user.id);
    if (!doctorId) return res.json([]);

    const { status } = req.params;
    const validStatuses = [
      "draft",
      "pending",
      "confirmed",
      "active",
      "on_hold",
      "completed",
      "cancelled",
      "overdue",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const therapies = await Therapy.findAll({
      where: {
        doctor_id: doctorId,
        status: status
      },
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(therapies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get therapy calendar data
exports.getCalendar = async (req, res) => {
  try {
    const doctorId = await getCurrentDoctorId(req.user.id);
    if (!doctorId) return res.json([]);

    const { start_date, end_date } = req.query;
    if (!start_date || !end_date) {
      return res.status(400).json({ error: "start_date and end_date are required" });
    }

    const calendarData = await Therapy.findAll({
      where: {
        doctor_id: doctorId,
        [Op.or]: [
          {
            start_date: {
              [Op.between]: [new Date(start_date), new Date(end_date)]
            }
          },
          {
            follow_up_date: {
              [Op.between]: [new Date(start_date), new Date(end_date)]
            }
          }
        ]
      },
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'name']
        }
      ]
    });

    res.json(calendarData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get single therapy by ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = await getCurrentDoctorId(req.user.id);

    const therapy = await Therapy.findOne({
      where: { id: id, doctor_id: doctorId },
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Appointment,
          as: 'appointment',
          required: false
        }
      ]
    });

    if (!therapy) {
      return res.status(404).json({ error: "Therapy not found or access denied" });
    }

    res.json(therapy);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create new therapy
exports.create = async (req, res) => {
  try {
    const doctorId = await getCurrentDoctorId(req.user.id);
    if (!doctorId) {
      return res.status(404).json({ error: "Doctor profile not found" });
    }

    const {
      appointment_id,
      patient_id,
      therapy_text,
      medications,
      dosage,
      frequency,
      duration,
      instructions,
      follow_up_date,
      therapy_type,
      start_date,
      end_date,
      priority,
      patient_notes,
      doctor_notes,
    } = req.body;

    if (!appointment_id || !patient_id || !therapy_text) {
      return res.status(400).json({
        error: "appointment_id, patient_id, and therapy_text are required",
      });
    }

    const therapy = await Therapy.create({
      appointment_id,
      doctor_id: doctorId,
      patient_id,
      therapy_text,
      medications: medications || null,
      dosage: dosage || null,
      frequency: frequency || null,
      duration: duration || null,
      instructions: instructions || null,
      follow_up_date: follow_up_date || null,
      therapy_type: therapy_type || null,
      start_date: start_date || null,
      end_date: end_date || null,
      priority: priority || "medium",
      patient_notes: patient_notes || null,
      doctor_notes: doctor_notes || null,
    });

    // Create notification for patient
    try {
      await Notification.create({
        user_id: patient_id,
        sent_by_user_id: req.user.id,
        title: 'New Therapy Assigned',
        message: `You have been assigned a new therapy: ${therapy_text}`,
        notification_type: 'therapy_assigned',
        optional_link: '/patient/therapies',
        is_read: false
      });
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
    }

    res.status(201).json({ id: therapy.id, message: "Therapy created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update therapy
exports.update = async (req, res) => {
  try {
    const doctorId = await getCurrentDoctorId(req.user.id);
    const therapyId = req.params.id;

    // Verify therapy belongs to this doctor
    const therapy = await Therapy.findOne({
      where: { id: therapyId, doctor_id: doctorId }
    });

    if (!therapy) {
      return res.status(404).json({ error: "Therapy not found or access denied" });
    }

    const {
      therapy_text,
      medications,
      dosage,
      frequency,
      duration,
      instructions,
      follow_up_date,
      status,
    } = req.body;

    await therapy.update({
      therapy_text,
      medications,
      dosage,
      frequency,
      duration,
      instructions,
      follow_up_date,
      status,
    });

    // Create notification for patient
    try {
      await Notification.create({
        user_id: therapy.patient_id,
        sent_by_user_id: req.user.id,
        title: 'Therapy Updated',
        message: 'Your therapy has been updated with new information',
        notification_type: 'therapy_updated',
        optional_link: '/patient/therapies',
        is_read: false
      });
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
    }

    res.json({ message: "Therapy updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update therapy status
exports.updateStatus = async (req, res) => {
  try {
    const doctorId = await getCurrentDoctorId(req.user.id);
    const therapyId = req.params.id;
    const { status } = req.body;

    // Verify therapy belongs to this doctor
    const therapy = await Therapy.findOne({
      where: { id: therapyId, doctor_id: doctorId }
    });

    if (!therapy) {
      return res.status(404).json({ error: "Therapy not found or access denied" });
    }

    const validStatuses = [
      "draft",
      "pending",
      "confirmed",
      "active",
      "on_hold",
      "completed",
      "cancelled",
      "overdue",
    ];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    await therapy.update({ status: status });

    // Create notification for patient
    try {
      await Notification.create({
        user_id: therapy.patient_id,
        sent_by_user_id: req.user.id,
        title: 'Therapy Status Updated',
        message: `Your therapy status has been updated to: ${status}`,
        notification_type: 'therapy_status_update',
        optional_link: '/patient/therapies',
        is_read: false
      });
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
    }

    res.json({ message: "Therapy status updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete therapy
exports.delete = async (req, res) => {
  try {
    const doctorId = await getCurrentDoctorId(req.user.id);
    const therapyId = req.params.id;

    // Verify therapy belongs to this doctor
    const therapy = await Therapy.findOne({
      where: { id: therapyId, doctor_id: doctorId }
    });

    if (!therapy) {
      return res.status(404).json({ error: "Therapy not found or access denied" });
    }

    await therapy.destroy();

    res.json({ message: "Therapy deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
