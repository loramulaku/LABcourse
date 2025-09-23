import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Doctor = sequelize.define("Doctor", {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  user_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  image: { 
    type: DataTypes.STRING, 
    defaultValue: '/uploads/avatars/default.png' 
  },
  first_name: { 
    type: DataTypes.STRING(100), 
    defaultValue: '' 
  },
  last_name: { 
    type: DataTypes.STRING(100), 
    defaultValue: '' 
  },
  phone: { 
    type: DataTypes.STRING(20), 
    defaultValue: '' 
  },
  specialization: { 
    type: DataTypes.STRING(255), 
    defaultValue: '' 
  },
  department: { 
    type: DataTypes.STRING(255), 
    defaultValue: '' 
  },
  degree: { 
    type: DataTypes.STRING(255), 
    defaultValue: '' 
  },
  license_number: { 
    type: DataTypes.STRING(50), 
    defaultValue: '' 
  },
  experience: { 
    type: DataTypes.TEXT 
  },
  experience_years: { 
    type: DataTypes.INTEGER, 
    defaultValue: 0 
  },
  about: { 
    type: DataTypes.TEXT 
  },
  consultation_fee: { 
    type: DataTypes.DECIMAL(10, 2) 
  },
  fees: { 
    type: DataTypes.DECIMAL(10, 2) 
  },
  address_line1: { 
    type: DataTypes.STRING(255), 
    defaultValue: '' 
  },
  address_line2: { 
    type: DataTypes.STRING(255), 
    defaultValue: '' 
  },
  avatar_path: { 
    type: DataTypes.STRING(255), 
    defaultValue: '/uploads/avatars/default.png' 
  },
  facebook: { 
    type: DataTypes.STRING(255), 
    defaultValue: '' 
  },
  x: { 
    type: DataTypes.STRING(255), 
    defaultValue: '' 
  },
  linkedin: { 
    type: DataTypes.STRING(255), 
    defaultValue: '' 
  },
  instagram: { 
    type: DataTypes.STRING(255), 
    defaultValue: '' 
  },
  country: { 
    type: DataTypes.STRING(100), 
    defaultValue: '' 
  },
  city_state: { 
    type: DataTypes.STRING(150), 
    defaultValue: '' 
  },
  postal_code: { 
    type: DataTypes.STRING(50), 
    defaultValue: '' 
  },
  available: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: true 
  },
  created_at: { 
    type: DataTypes.DATE, 
    defaultValue: DataTypes.NOW 
  },
  updated_at: { 
    type: DataTypes.DATE, 
    defaultValue: DataTypes.NOW 
  }
}, {
  tableName: 'doctors',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Doctor;
