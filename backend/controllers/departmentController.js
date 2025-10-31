const { Department, Doctor } = require('../models');

/**
 * Get all departments
 */
exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll({
      include: [
        {
          model: Doctor,
          as: 'doctors',
          attributes: ['id', 'first_name', 'last_name', 'specialization', 'consultation_fee'],
        },
        {
          model: Doctor,
          as: 'headDoctor',
          attributes: ['id', 'first_name', 'last_name'],
        },
      ],
      order: [['name', 'ASC']],
    });

    res.json({
      success: true,
      data: departments,
      count: departments.length,
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch departments',
      message: error.message,
    });
  }
};

/**
 * Get department by ID
 */
exports.getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findByPk(id, {
      include: [
        {
          model: Doctor,
          as: 'doctors',
          attributes: ['id', 'first_name', 'last_name', 'specialization', 'consultation_fee', 'experience_years'],
        },
        {
          model: Doctor,
          as: 'headDoctor',
          attributes: ['id', 'first_name', 'last_name'],
        },
      ],
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found',
      });
    }

    res.json({
      success: true,
      data: department,
    });
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch department',
      message: error.message,
    });
  }
};

/**
 * Create new department
 */
exports.createDepartment = async (req, res) => {
  try {
    const { name, description, location, head_doctor_id, phone, email, budget, specializations } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Department name is required',
      });
    }

    // Check if department already exists
    const existingDept = await Department.findOne({ where: { name } });
    if (existingDept) {
      return res.status(400).json({
        success: false,
        error: 'Department with this name already exists',
      });
    }

    // Verify head_doctor_id exists if provided
    if (head_doctor_id) {
      const doctor = await Doctor.findByPk(head_doctor_id);
      if (!doctor) {
        return res.status(400).json({
          success: false,
          error: 'Head doctor not found',
        });
      }
    }

    // Filter out empty specializations
    const validSpecializations = Array.isArray(specializations)
      ? specializations.filter((spec) => spec && spec.trim() !== '')
      : [];

    const department = await Department.create({
      name,
      description,
      location,
      head_doctor_id,
      phone,
      email,
      budget,
      specializations: validSpecializations,
    });

    res.status(201).json({
      success: true,
      data: department,
      message: 'Department created successfully',
    });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create department',
      message: error.message,
    });
  }
};

/**
 * Update department
 */
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, location, head_doctor_id, phone, email, budget, is_active, specializations } = req.body;

    const department = await Department.findByPk(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found',
      });
    }

    // Check if new name already exists (if name is being changed)
    if (name && name !== department.name) {
      const existingDept = await Department.findOne({ where: { name } });
      if (existingDept) {
        return res.status(400).json({
          success: false,
          error: 'Department with this name already exists',
        });
      }
    }

    // Verify head_doctor_id exists if provided
    if (head_doctor_id) {
      const doctor = await Doctor.findByPk(head_doctor_id);
      if (!doctor) {
        return res.status(400).json({
          success: false,
          error: 'Head doctor not found',
        });
      }
    }

    // Filter out empty specializations
    const validSpecializations = Array.isArray(specializations)
      ? specializations.filter((spec) => spec && spec.trim() !== '')
      : department.specializations;

    await department.update({
      name: name || department.name,
      description: description !== undefined ? description : department.description,
      location: location || department.location,
      head_doctor_id: head_doctor_id !== undefined ? head_doctor_id : department.head_doctor_id,
      phone: phone || department.phone,
      email: email || department.email,
      budget: budget !== undefined ? budget : department.budget,
      is_active: is_active !== undefined ? is_active : department.is_active,
      specializations: validSpecializations,
    });

    res.json({
      success: true,
      data: department,
      message: 'Department updated successfully',
    });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update department',
      message: error.message,
    });
  }
};

/**
 * Delete department
 */
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findByPk(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found',
      });
    }

    // Check if department has doctors
    const doctorCount = await Doctor.count({ where: { department_id: id } });
    if (doctorCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete department with ${doctorCount} assigned doctors. Please reassign them first.`,
      });
    }

    await department.destroy();

    res.json({
      success: true,
      message: 'Department deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete department',
      message: error.message,
    });
  }
};

/**
 * Get doctors by department
 */
exports.getDoctorsByDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findByPk(id, {
      include: [
        {
          model: Doctor,
          as: 'doctors',
          attributes: ['id', 'first_name', 'last_name', 'specialization', 'consultation_fee', 'experience_years', 'available'],
        },
      ],
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found',
      });
    }

    res.json({
      success: true,
      data: department.doctors,
      count: department.doctors.length,
    });
  } catch (error) {
    console.error('Error fetching doctors by department:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch doctors',
      message: error.message,
    });
  }
};

/**
 * Assign doctor to department
 */
exports.assignDoctorToDepartment = async (req, res) => {
  try {
    const { departmentId, doctorId } = req.body;

    const department = await Department.findByPk(departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found',
      });
    }

    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found',
      });
    }

    await doctor.update({ department_id: departmentId });

    res.json({
      success: true,
      data: doctor,
      message: 'Doctor assigned to department successfully',
    });
  } catch (error) {
    console.error('Error assigning doctor to department:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign doctor',
      message: error.message,
    });
  }
};
