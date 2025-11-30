'use strict';

/**
 * Clinical Assessment Model
 * Stores comprehensive clinical assessment data separately from appointments
 * Maintains audit trail and supports view/edit history
 */
module.exports = (sequelize, DataTypes) => {
  const ClinicalAssessment = sequelize.define('ClinicalAssessment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    appointment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true, // One assessment per appointment
      references: {
        model: 'appointments',
        key: 'id',
      },
    },
    doctor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'doctors',
        key: 'id',
      },
    },
    patient_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    
    // Clinical Assessment Content
    clinical_notes: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Detailed clinical assessment notes',
    },
    diagnosis: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Primary and differential diagnosis',
    },
    chief_complaint: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Main complaint from patient',
    },
    
    // Vitals
    vitals: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Blood pressure, heart rate, temperature, etc.',
      /* Example structure:
      {
        "blood_pressure": "120/80",
        "heart_rate": 75,
        "temperature": 98.6,
        "respiratory_rate": 16,
        "oxygen_saturation": 98,
        "weight": 70,
        "height": 175
      }
      */
    },
    
    // Physical Examination
    physical_examination: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Physical examination findings',
    },
    
    // Treatment Decision
    requires_admission: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      comment: 'Whether patient requires hospital admission',
    },
    therapy_prescribed: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Prescribed therapy/medications if discharged',
    },
    treatment_plan: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Detailed treatment plan',
    },
    follow_up_instructions: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Follow-up care instructions for patient',
    },
    follow_up_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Recommended follow-up appointment date',
    },
    
    // Admission Details (if applicable)
    admission_details: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Details for hospital admission if required',
      /* Example structure:
      {
        "recommended_ward_id": 1,
        "recommended_room_type": "ICU",
        "urgency": "High",
        "estimated_duration_days": 5
      }
      */
    },
    
    // Lab/Test Orders
    lab_tests_ordered: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Laboratory tests ordered',
    },
    imaging_ordered: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Imaging studies ordered (X-ray, CT, MRI, etc.)',
    },
    
    // Status and Locking
    status: {
      type: DataTypes.ENUM('draft', 'submitted', 'locked'),
      defaultValue: 'draft',
      comment: 'Assessment status - locked prevents editing',
    },
    is_locked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether assessment is locked from editing',
    },
    locked_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the assessment was locked',
    },
    locked_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'User ID who locked the assessment',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    
    // Audit Trail
    submitted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When assessment was submitted',
    },
    submitted_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'User ID who submitted (should match doctor_id)',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    last_modified_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'User ID who last modified',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    
    // Version Control (for edit history)
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: 'Version number for tracking changes',
    },
    
    // Notes
    internal_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Internal notes not visible to patient',
    },
  }, {
    tableName: 'clinical_assessments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_assessment_appointment',
        fields: ['appointment_id'],
        unique: true,
      },
      {
        name: 'idx_assessment_doctor',
        fields: ['doctor_id'],
      },
      {
        name: 'idx_assessment_patient',
        fields: ['patient_id'],
      },
      {
        name: 'idx_assessment_status',
        fields: ['status'],
      },
    ],
  });

  ClinicalAssessment.associate = function(models) {
    ClinicalAssessment.belongsTo(models.Appointment, {
      foreignKey: 'appointment_id',
      as: 'appointment',
      onDelete: 'CASCADE',
    });

    ClinicalAssessment.belongsTo(models.Doctor, {
      foreignKey: 'doctor_id',
      as: 'doctor',
      onDelete: 'RESTRICT',
    });

    ClinicalAssessment.belongsTo(models.User, {
      foreignKey: 'patient_id',
      as: 'patient',
      onDelete: 'RESTRICT',
    });

    ClinicalAssessment.belongsTo(models.User, {
      foreignKey: 'submitted_by',
      as: 'submitter',
      onDelete: 'SET NULL',
    });

    ClinicalAssessment.belongsTo(models.User, {
      foreignKey: 'locked_by',
      as: 'locker',
      onDelete: 'SET NULL',
    });

    ClinicalAssessment.belongsTo(models.User, {
      foreignKey: 'last_modified_by',
      as: 'lastModifier',
      onDelete: 'SET NULL',
    });
  };

  return ClinicalAssessment;
};
