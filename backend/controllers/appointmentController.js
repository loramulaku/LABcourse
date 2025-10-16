const { Appointment, Doctor, User, Notification } = require('../models');
const { Op } = require('sequelize');

const appointmentController = {
  // Get all appointments
  async getAllAppointments(req, res) {
    try {
      const appointments = await Appointment.findAll({
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email'],
          },
          {
            model: Doctor,
            attributes: ['id', 'first_name', 'last_name', 'specialization'],
            include: [
              {
                model: User,
                attributes: ['name', 'email'],
              },
            ],
          },
        ],
        order: [['scheduled_for', 'DESC']],
      });

      res.json(appointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      res.status(500).json({ error: 'Failed to fetch appointments' });
    }
  },

  // Get appointment by ID
  async getAppointmentById(req, res) {
    try {
      const appointmentId = req.params.id;

      const appointment = await Appointment.findByPk(appointmentId, {
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email'],
          },
          {
            model: Doctor,
            attributes: ['id', 'first_name', 'last_name', 'specialization', 'phone'],
            include: [
              {
                model: User,
                attributes: ['name', 'email'],
              },
            ],
          },
        ],
      });

      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      res.json(appointment);
    } catch (error) {
      console.error('Error fetching appointment:', error);
      res.status(500).json({ error: 'Failed to fetch appointment' });
    }
  },

  // Get user's appointments
  async getUserAppointments(req, res) {
    try {
      const userId = req.params.userId || req.user.id;

      const appointments = await Appointment.findAll({
        where: { user_id: userId },
        include: [
          {
            model: Doctor,
            attributes: ['id', 'first_name', 'last_name', 'specialization', 'phone'],
            include: [
              {
                model: User,
                attributes: ['name', 'email'],
              },
            ],
          },
        ],
        order: [['scheduled_for', 'DESC']],
      });

      res.json(appointments);
    } catch (error) {
      console.error('Error fetching user appointments:', error);
      res.status(500).json({ error: 'Failed to fetch appointments' });
    }
  },

  // Get doctor's appointments
  async getDoctorAppointments(req, res) {
    try {
      const doctorId = req.params.doctorId;

      const appointments = await Appointment.findAll({
        where: { doctor_id: doctorId },
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email'],
          },
        ],
        order: [['scheduled_for', 'DESC']],
      });

      res.json(appointments);
    } catch (error) {
      console.error('Error fetching doctor appointments:', error);
      res.status(500).json({ error: 'Failed to fetch appointments' });
    }
  },

  // Create appointment
  async createAppointment(req, res) {
    try {
      const appointmentData = {
        ...req.body,
        user_id: req.user.id,
      };

      // Check for conflicting appointments
      const existingAppointment = await Appointment.findOne({
        where: {
          doctor_id: appointmentData.doctor_id,
          scheduled_for: appointmentData.scheduled_for,
          status: {
            [Op.notIn]: ['CANCELLED', 'DECLINED'],
          },
        },
      });

      if (existingAppointment) {
        return res.status(400).json({ error: 'This time slot is already booked' });
      }

      const appointment = await Appointment.create(appointmentData);

      // Send notification to doctor
      const doctor = await Doctor.findByPk(appointmentData.doctor_id);
      if (doctor) {
        await Notification.create({
          user_id: doctor.user_id,
          sent_by_user_id: req.user.id,
          title: 'New Appointment Request',
          message: `You have a new appointment request for ${new Date(appointmentData.scheduled_for).toLocaleString()}`,
          notification_type: 'general_message',
        });
      }

      res.status(201).json(appointment);
    } catch (error) {
      console.error('Error creating appointment:', error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ error: 'This time slot is already booked' });
      }
      res.status(500).json({ error: 'Failed to create appointment' });
    }
  },

  // Update appointment
  async updateAppointment(req, res) {
    try {
      const appointmentId = req.params.id;
      const updates = req.body;

      const appointment = await Appointment.findByPk(appointmentId);

      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      await appointment.update(updates);

      // If status changed, send notification
      if (updates.status) {
        let notificationMessage = '';
        let notificationType = 'general_message';

        switch (updates.status) {
          case 'CONFIRMED':
            notificationMessage = `Your appointment has been confirmed for ${new Date(appointment.scheduled_for).toLocaleString()}`;
            notificationType = 'appointment_confirmed';
            break;
          case 'DECLINED':
            notificationMessage = `Your appointment request has been declined`;
            notificationType = 'appointment_cancelled';
            break;
          case 'CANCELLED':
            notificationMessage = `Your appointment has been cancelled`;
            notificationType = 'appointment_cancelled';
            break;
        }

        if (notificationMessage) {
          await Notification.create({
            user_id: appointment.user_id,
            sent_by_user_id: req.user.id,
            title: 'Appointment Status Update',
            message: notificationMessage,
            notification_type: notificationType,
          });
        }
      }

      res.json(appointment);
    } catch (error) {
      console.error('Error updating appointment:', error);
      res.status(500).json({ error: 'Failed to update appointment' });
    }
  },

  // Delete/Cancel appointment
  async deleteAppointment(req, res) {
    try {
      const appointmentId = req.params.id;

      const appointment = await Appointment.findByPk(appointmentId);

      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      // Instead of deleting, mark as cancelled
      await appointment.update({ status: 'CANCELLED' });

      res.json({ message: 'Appointment cancelled successfully' });
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      res.status(500).json({ error: 'Failed to cancel appointment' });
    }
  },

  // Get available time slots for a doctor
  async getAvailableSlots(req, res) {
    try {
      const { doctorId, date } = req.query;

      if (!doctorId || !date) {
        return res.status(400).json({ error: 'Doctor ID and date are required' });
      }

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const bookedAppointments = await Appointment.findAll({
        where: {
          doctor_id: doctorId,
          scheduled_for: {
            [Op.between]: [startOfDay, endOfDay],
          },
          status: {
            [Op.notIn]: ['CANCELLED', 'DECLINED'],
          },
        },
        attributes: ['scheduled_for'],
      });

      res.json({
        bookedSlots: bookedAppointments.map(a => a.scheduled_for),
      });
    } catch (error) {
      console.error('Error fetching available slots:', error);
      res.status(500).json({ error: 'Failed to fetch available slots' });
    }
  },
};

module.exports = appointmentController;

