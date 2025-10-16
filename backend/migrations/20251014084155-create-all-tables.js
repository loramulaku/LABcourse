'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(150),
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      role: {
        type: Sequelize.ENUM('user', 'doctor', 'admin', 'lab'),
        allowNull: false,
        defaultValue: 'user',
      },
      account_status: {
        type: Sequelize.ENUM('active', 'pending', 'rejected', 'suspended'),
        defaultValue: 'active',
      },
      verification_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      verified_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      verified_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      engine: 'InnoDB',
    });

    // Add indexes for users
    await queryInterface.addIndex('users', ['role', 'account_status'], {
      name: 'idx_users_role_status',
    });

    // Add self-reference FK for verified_by
    await queryInterface.addConstraint('users', {
      fields: ['verified_by'],
      type: 'foreign key',
      name: 'fk_users_verified_by',
      references: {
        table: 'users',
        field: 'id',
      },
      onDelete: 'SET NULL',
    });

    // 2. Create user_profiles table
    await queryInterface.createTable('user_profiles', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      address_line1: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      address_line2: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      gender: {
        type: Sequelize.ENUM('Male', 'Female', 'Other'),
        allowNull: true,
      },
      dob: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      profile_image: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: 'uploads/default.png',
      },
      notifications_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      engine: 'InnoDB',
    });

    // 3. Create refresh_tokens table
    await queryInterface.createTable('refresh_tokens', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      token: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      engine: 'InnoDB',
    });

    await queryInterface.addIndex('refresh_tokens', ['user_id'], {
      name: 'idx_refresh_user',
    });

    // 4. Create admin_profiles table
    await queryInterface.createTable('admin_profiles', {
      user_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      first_name: {
        type: Sequelize.STRING(100),
        defaultValue: '',
      },
      last_name: {
        type: Sequelize.STRING(100),
        defaultValue: '',
      },
      phone: {
        type: Sequelize.STRING(30),
        defaultValue: '',
      },
      bio: {
        type: Sequelize.STRING(255),
        defaultValue: '',
      },
      avatar_path: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: '/uploads/avatars/default.png',
      },
      facebook: {
        type: Sequelize.STRING(255),
        defaultValue: '',
      },
      x: {
        type: Sequelize.STRING(255),
        defaultValue: '',
      },
      linkedin: {
        type: Sequelize.STRING(255),
        defaultValue: '',
      },
      instagram: {
        type: Sequelize.STRING(255),
        defaultValue: '',
      },
      country: {
        type: Sequelize.STRING(100),
        defaultValue: '',
      },
      city_state: {
        type: Sequelize.STRING(150),
        defaultValue: '',
      },
      postal_code: {
        type: Sequelize.STRING(50),
        defaultValue: '',
      },
      tax_id: {
        type: Sequelize.STRING(100),
        defaultValue: '',
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      engine: 'InnoDB',
    });

    // 5. Create doctors table
    await queryInterface.createTable('doctors', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      image: {
        type: Sequelize.STRING(255),
        defaultValue: '/uploads/avatars/default.png',
      },
      first_name: {
        type: Sequelize.STRING(100),
        defaultValue: '',
      },
      last_name: {
        type: Sequelize.STRING(100),
        defaultValue: '',
      },
      phone: {
        type: Sequelize.STRING(20),
        defaultValue: '',
      },
      specialization: {
        type: Sequelize.STRING(255),
        defaultValue: '',
      },
      department: {
        type: Sequelize.STRING(255),
        defaultValue: '',
      },
      degree: {
        type: Sequelize.STRING(255),
        defaultValue: '',
      },
      license_number: {
        type: Sequelize.STRING(50),
        defaultValue: '',
      },
      experience: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      experience_years: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      about: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      consultation_fee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      fees: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      address_line1: {
        type: Sequelize.STRING(255),
        defaultValue: '',
      },
      address_line2: {
        type: Sequelize.STRING(255),
        defaultValue: '',
      },
      avatar_path: {
        type: Sequelize.STRING(255),
        defaultValue: '/uploads/avatars/default.png',
      },
      facebook: {
        type: Sequelize.STRING(255),
        defaultValue: '',
      },
      x: {
        type: Sequelize.STRING(255),
        defaultValue: '',
      },
      linkedin: {
        type: Sequelize.STRING(255),
        defaultValue: '',
      },
      instagram: {
        type: Sequelize.STRING(255),
        defaultValue: '',
      },
      country: {
        type: Sequelize.STRING(100),
        defaultValue: '',
      },
      city_state: {
        type: Sequelize.STRING(150),
        defaultValue: '',
      },
      postal_code: {
        type: Sequelize.STRING(50),
        defaultValue: '',
      },
      available: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      engine: 'InnoDB',
    });

    await queryInterface.addIndex('doctors', ['user_id'], {
      name: 'idx_doctors_user_id',
    });

    // 6. Create laboratories table
    await queryInterface.createTable('laboratories', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      address: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      working_hours: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      engine: 'InnoDB',
    });

    // 7. Create analysis_types table
    await queryInterface.createTable('analysis_types', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      normal_range: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      unit: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00,
      },
      laboratory_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'laboratories',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      engine: 'InnoDB',
    });

    await queryInterface.addIndex('analysis_types', ['laboratory_id'], {
      name: 'idx_analysis_types_lab_id',
    });

    // 8. Create patient_analyses table
    await queryInterface.createTable('patient_analyses', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      analysis_type_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'analysis_types',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      laboratory_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'laboratories',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      result: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      result_pdf_path: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      result_note: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('unconfirmed', 'confirmed', 'pending_result', 'completed', 'cancelled'),
        defaultValue: 'unconfirmed',
      },
      appointment_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      completion_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      engine: 'InnoDB',
    });

    await queryInterface.addIndex('patient_analyses', ['user_id'], {
      name: 'idx_patient_analyses_user',
    });
    await queryInterface.addIndex('patient_analyses', ['analysis_type_id'], {
      name: 'idx_patient_analyses_analysis_type',
    });
    await queryInterface.addIndex('patient_analyses', ['laboratory_id'], {
      name: 'idx_patient_analyses_lab',
    });

    // 9. Create notifications table
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      sent_by_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      notification_type: {
        type: Sequelize.ENUM('result_ready', 'appointment_confirmed', 'appointment_cancelled', 'general_message', 'system_alert'),
        defaultValue: 'general_message',
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      optional_link: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      attachment_path: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      engine: 'InnoDB',
    });

    await queryInterface.addIndex('notifications', ['user_id'], {
      name: 'idx_notifications_user',
    });

    // 10. Create messages table
    await queryInterface.createTable('messages', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      sender_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      recipient_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      subject: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      message_type: {
        type: Sequelize.ENUM('broadcast', 'individual', 'group'),
        defaultValue: 'individual',
      },
      attachment_path: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      engine: 'InnoDB',
    });

    await queryInterface.addIndex('messages', ['sender_id'], {
      name: 'idx_messages_sender',
    });
    await queryInterface.addIndex('messages', ['recipient_id'], {
      name: 'idx_messages_recipient',
    });

    // 11. Create message_senders table
    await queryInterface.createTable('message_senders', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      message_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'messages',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      sender_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      sender_email: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      engine: 'InnoDB',
    });

    // 12. Create contact_message_redirects table
    await queryInterface.createTable('contact_message_redirects', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      original_message_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'messages',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      redirected_to_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      redirected_by_admin_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      redirect_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('pending', 'responded', 'closed'),
        defaultValue: 'pending',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      engine: 'InnoDB',
    });

    await queryInterface.addIndex('contact_message_redirects', ['original_message_id'], {
      name: 'idx_redirects_original',
    });
    await queryInterface.addIndex('contact_message_redirects', ['redirected_to_user_id'], {
      name: 'idx_redirects_recipient',
    });

    // 13. Create analysis_history table
    await queryInterface.createTable('analysis_history', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      patient_analysis_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'patient_analyses',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      action_type: {
        type: Sequelize.ENUM('created', 'status_changed', 'result_uploaded', 'result_updated', 'cancelled', 'confirmed'),
        allowNull: false,
      },
      old_status: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      new_status: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      performed_by_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      result_pdf_path: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      result_note: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      engine: 'InnoDB',
    });

    await queryInterface.addIndex('analysis_history', ['patient_analysis_id'], {
      name: 'idx_analysis_history_pa',
    });

    // 14. Create appointments table
    await queryInterface.createTable('appointments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      doctor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'doctors',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      scheduled_for: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      reason: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'CONFIRMED', 'DECLINED', 'CANCELLED'),
        defaultValue: 'PENDING',
      },
      stripe_session_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      payment_status: {
        type: Sequelize.ENUM('unpaid', 'paid', 'refunded'),
        defaultValue: 'unpaid',
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 20.00,
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'EUR',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      engine: 'InnoDB',
    });

    await queryInterface.addIndex('appointments', ['doctor_id', 'scheduled_for'], {
      name: 'uniq_doctor_time',
      unique: true,
    });
    await queryInterface.addIndex('appointments', ['user_id'], {
      name: 'idx_appointments_user',
    });
    await queryInterface.addIndex('appointments', ['doctor_id'], {
      name: 'idx_appointments_doctor',
    });

    // 15. Create doctor_applications table
    await queryInterface.createTable('doctor_applications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      license_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      medical_field: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      specialization: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      experience_years: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      education: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      previous_clinic: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      license_upload_path: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      cv_upload_path: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      additional_documents: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      reviewed_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      reviewed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      engine: 'InnoDB',
    });

    // 16. Create password_reset_tokens table
    await queryInterface.createTable('password_reset_tokens', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      token: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      used: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      engine: 'InnoDB',
    });

    await queryInterface.addIndex('password_reset_tokens', ['token'], {
      name: 'idx_reset_token',
    });
    await queryInterface.addIndex('password_reset_tokens', ['user_id'], {
      name: 'idx_reset_user',
    });

    // 17. Create audit_logs table
    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      action: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      details: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      engine: 'InnoDB',
    });

    await queryInterface.addIndex('audit_logs', ['user_id', 'action'], {
      name: 'idx_audit_user_action',
    });
    await queryInterface.addIndex('audit_logs', ['created_at'], {
      name: 'idx_audit_created_at',
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order to respect foreign key constraints
    await queryInterface.dropTable('audit_logs');
    await queryInterface.dropTable('password_reset_tokens');
    await queryInterface.dropTable('doctor_applications');
    await queryInterface.dropTable('appointments');
    await queryInterface.dropTable('analysis_history');
    await queryInterface.dropTable('contact_message_redirects');
    await queryInterface.dropTable('message_senders');
    await queryInterface.dropTable('messages');
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('patient_analyses');
    await queryInterface.dropTable('analysis_types');
    await queryInterface.dropTable('laboratories');
    await queryInterface.dropTable('doctors');
    await queryInterface.dropTable('admin_profiles');
    await queryInterface.dropTable('refresh_tokens');
    await queryInterface.dropTable('user_profiles');
    await queryInterface.dropTable('users');
  },
};
