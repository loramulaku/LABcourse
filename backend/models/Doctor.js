import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Doctor = sequelize.define("Doctor", {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  image: { type: DataTypes.STRING },
  speciality: { type: DataTypes.STRING },
  degree: { type: DataTypes.STRING },
  experience: { type: DataTypes.STRING },
  about: { type: DataTypes.TEXT },
  fees: { type: DataTypes.DECIMAL },
  address_line1: { type: DataTypes.STRING },
  address_line2: { type: DataTypes.STRING },
});

export default Doctor;
