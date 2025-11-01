const { Doctor, User, Appointment, Department, sequelize } = require('../models');
const { Op } = require('sequelize');

const doctorController = {
  // Get all doctors
  async getAllDoctors(req, res) {
    try {
      const doctors = await Doctor.findAll({
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email', 'account_status'],
            where: { account_status: 'active' },
          },
          {
            model: Department,
            as: 'department',
            attributes: ['id', 'name', 'description'],
            required: false,
          },
        ],
        order: [['id', 'DESC']],
      });

      res.json(doctors);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      res.status(500).json({ error: 'Failed to fetch doctors' });
    }
  },

  // Get available doctors
  async getAvailableDoctors(req, res) {
    try {
      const doctors = await Doctor.findAll({
        where: { available: true },
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email'],
            where: { account_status: 'active' },
          },
          {
            model: Department,
            as: 'department',
            attributes: ['id', 'name'],
            required: false,
          },
        ],
        order: [['first_name', 'ASC']],
      });

      res.json(doctors);
    } catch (error) {
      console.error('Error fetching available doctors:', error);
      res.status(500).json({ error: 'Failed to fetch available doctors' });
    }
  },

  // Get doctor by ID
  async getDoctorById(req, res) {
    try {
      const doctorId = req.params.id;

      const doctor = await Doctor.findByPk(doctorId, {
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email', 'account_status'],
          },
          {
            model: Department,
            as: 'department',
            attributes: ['id', 'name', 'description', 'location'],
            required: false,
          },
        ],
      });

      if (!doctor) {
        return res.status(404).json({ error: 'Doctor not found' });
      }

      res.json(doctor);
    } catch (error) {
      console.error('Error fetching doctor:', error);
      res.status(500).json({ error: 'Failed to fetch doctor' });
    }
  },

  // Get doctor by user ID
  async getDoctorByUserId(req, res) {
    try {
      const userId = req.params.userId;

      const doctor = await Doctor.findOne({
        where: { user_id: userId },
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email', 'account_status'],
          },
        ],
      });

      if (!doctor) {
        return res.status(404).json({ error: 'Doctor not found' });
      }

      res.json(doctor);
    } catch (error) {
      console.error('Error fetching doctor:', error);
      res.status(500).json({ error: 'Failed to fetch doctor' });
    }
  },

  // Create doctor (with user account)
  async createDoctor(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const {
        // User fields
        name,
        email,
        password,
        phone,
        // Doctor fields
        specialization,
        specializations,
        degree,
        experience_years,
        experience,
        fees,
        consultation_fee,
        address_line1,
        address_line2,
        about,
        available,
        license_number,
        department_id,
        first_name,
        last_name,
      } = req.body;

      // Normalize specializations input (can arrive as JSON string or array)
      let specializationsArr = [];
      if (specializations) {
        if (Array.isArray(specializations)) {
          specializationsArr = specializations;
        } else {
          try {
            const parsed = JSON.parse(specializations);
            if (Array.isArray(parsed)) specializationsArr = parsed;
          } catch (e) {
            // ignore parse errors, fallback handled below
          }
        }
      }

      // Validate required fields
      if (!name || !email || !password) {
        if (transaction && !transaction.finished) {
          await transaction.rollback();
        }
        return res.status(400).json({ 
          error: 'Missing required fields: name, email, and password are required' 
        });
      }

      // Check if email already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        if (transaction && !transaction.finished) {
          await transaction.rollback();
        }
        return res.status(400).json({ 
          error: 'Email already exists' 
        });
      }

      // Create user account
      const user = await User.create({
        name,
        email,
        password, // Will be hashed by User model hook
        role: 'doctor',
        account_status: 'active',
      }, { transaction });

      // Handle image upload
      const imagePath = req.file 
        ? `/uploads/${req.file.filename}` 
        : '/uploads/avatars/default.png';

      // Create doctor profile
      const doctor = await Doctor.create({
        user_id: user.id,
        image: imagePath,
        avatar_path: imagePath,
        first_name: first_name || name.split(' ')[0] || '',
        last_name: last_name || name.split(' ').slice(1).join(' ') || '',
        phone: phone || '',
        specialization: specialization || specializationsArr[0] || '',
        specializations: specializationsArr,
        degree: degree || '',
        license_number: license_number || '',
        experience_years: experience_years ? parseInt(experience_years) : 0,
        experience: experience || '',
        about: about || '',
        consultation_fee: consultation_fee || fees || null,
        fees: fees || consultation_fee || null,
        address_line1: address_line1 || '',
        address_line2: address_line2 || '',
        department_id: department_id ? parseInt(department_id) : null,
        available: available !== undefined ? available : true,
      }, { transaction });

      await transaction.commit();

      // Return doctor with user info and department
      const createdDoctor = await Doctor.findByPk(doctor.id, {
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email', 'role', 'account_status'],
          },
          {
            model: Department,
            as: 'department',
            attributes: ['id', 'name', 'description'],
            required: false,
          },
        ],
      });

      res.status(201).json({
        message: 'Doctor created successfully',
        doctor: createdDoctor,
      });

    } catch (error) {
      // Only rollback if transaction hasn't been committed
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      console.error('Error creating doctor:', error);
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ 
          error: 'Validation error', 
          details: error.errors.map(e => e.message) 
        });
      }
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ 
          error: 'Doctor profile already exists for this user' 
        });
      }

      res.status(500).json({ 
        error: 'Failed to create doctor',
        details: error.message 
      });
    }
  },

  // Update doctor
  async updateDoctor(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const doctorId = req.params.id;
      const updates = req.body;

      const doctor = await Doctor.findByPk(doctorId, {
        include: [{ model: User }],
      });

      if (!doctor) {
        if (transaction && !transaction.finished) {
          await transaction.rollback();
        }
        return res.status(404).json({ error: 'Doctor not found' });
      }

      // Handle image upload
      if (req.file) {
        updates.image = `/uploads/${req.file.filename}`;
        updates.avatar_path = `/uploads/${req.file.filename}`;
      }

      // Parse department_id if provided
      if (updates.department_id !== undefined) {
        updates.department_id = updates.department_id ? parseInt(updates.department_id) : null;
      }

      // Parse numeric fields
      if (updates.experience_years) {
        updates.experience_years = parseInt(updates.experience_years);
      }
      if (updates.consultation_fee) {
        updates.consultation_fee = parseFloat(updates.consultation_fee);
      }

      // Parse specializations if provided (can be JSON string or array)
      if (updates.specializations !== undefined) {
        if (typeof updates.specializations === 'string') {
          try {
            const parsed = JSON.parse(updates.specializations);
            if (Array.isArray(parsed)) updates.specializations = parsed;
          } catch (e) {
            // leave as-is if not JSON
          }
        }
        // Backward compatibility: set single specialization from first of array if not explicitly provided
        if (!updates.specialization && Array.isArray(updates.specializations) && updates.specializations.length > 0) {
          updates.specialization = updates.specializations[0];
        }
      }

      console.log('Updating doctor with:', updates);

      // Update doctor profile
      await doctor.update(updates, { transaction });

      // Update user info if provided
      if (updates.name || updates.email || updates.phone) {
        const userUpdates = {};
        if (updates.name) userUpdates.name = updates.name;
        if (updates.email) userUpdates.email = updates.email;
        if (updates.phone) userUpdates.phone = updates.phone;
        
        await doctor.User.update(userUpdates, { transaction });
      }

      await transaction.commit();

      // Fetch updated doctor with user info and department
      const updatedDoctor = await Doctor.findByPk(doctorId, {
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email', 'role', 'account_status'],
          },
          {
            model: Department,
            as: 'department',
            attributes: ['id', 'name', 'description'],
            required: false,
          },
        ],
      });

      res.json({
        message: 'Doctor updated successfully',
        doctor: updatedDoctor,
      });

    } catch (error) {
      // Only rollback if transaction hasn't been committed
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      console.error('Error updating doctor:', error);
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ 
          error: 'Validation error', 
          details: error.errors.map(e => e.message) 
        });
      }
      
      res.status(500).json({ 
        error: 'Failed to update doctor',
        details: error.message 
      });
    }
  },

  // Update doctor by user ID
  async updateDoctorByUserId(req, res) {
    try {
      const userId = req.params.userId;
      const updates = req.body;

      const doctor = await Doctor.findOne({ where: { user_id: userId } });

      if (!doctor) {
        return res.status(404).json({ error: 'Doctor not found' });
      }

      await doctor.update(updates);

      res.json(doctor);
    } catch (error) {
      console.error('Error updating doctor:', error);
      res.status(500).json({ error: 'Failed to update doctor' });
    }
  },

  // Delete doctor
  async deleteDoctor(req, res) {
    try {
      const doctorId = req.params.id;

      const doctor = await Doctor.findByPk(doctorId);

      if (!doctor) {
        return res.status(404).json({ error: 'Doctor not found' });
      }

      await doctor.destroy();

      res.json({ message: 'Doctor deleted successfully' });
    } catch (error) {
      console.error('Error deleting doctor:', error);
      res.status(500).json({ error: 'Failed to delete doctor' });
    }
  },

  // Get doctor's appointments
  async getDoctorAppointments(req, res) {
    try {
      const doctorId = req.params.id;

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

  // Get doctor specializations (distinct)
  async getSpecializations(req, res) {
    try {
      const specializations = await Doctor.findAll({
        attributes: [[Doctor.sequelize.fn('DISTINCT', Doctor.sequelize.col('specialization')), 'specialization']],
        where: {
          specialization: {
            [Op.ne]: '',
          },
        },
        raw: true,
      });

      res.json(specializations.map(s => s.specialization));
    } catch (error) {
      console.error('Error fetching specializations:', error);
      res.status(500).json({ error: 'Failed to fetch specializations' });
    }
  },

  // Search doctors
  async searchDoctors(req, res) {
    try {
      const { query, specialization, available } = req.query;

      const whereClause = {};
      if (specialization) {
        whereClause.specialization = specialization;
      }
      if (available !== undefined) {
        whereClause.available = available === 'true';
      }

      const userWhereClause = { account_status: 'active' };
      if (query) {
        userWhereClause[Op.or] = [
          { name: { [Op.like]: `%${query}%` } },
        ];
      }

      if (query) {
        whereClause[Op.or] = [
          { first_name: { [Op.like]: `%${query}%` } },
          { last_name: { [Op.like]: `%${query}%` } },
          { specialization: { [Op.like]: `%${query}%` } },
          { department: { [Op.like]: `%${query}%` } },
        ];
      }

      const doctors = await Doctor.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email'],
            where: userWhereClause,
          },
        ],
        order: [['first_name', 'ASC']],
      });

      res.json(doctors);
    } catch (error) {
      console.error('Error searching doctors:', error);
      res.status(500).json({ error: 'Failed to search doctors' });
    }
  },
};

module.exports = doctorController;
