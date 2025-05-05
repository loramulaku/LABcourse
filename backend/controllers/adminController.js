import validator from "validator"
import bcrypt from "bcrypt"
import {v2 as cloudinary} from "cloudinary"
import doctorModel from "../models/doctorModel.js"


// Api për shtim Doktori
const addDoctor = async (req, res) => {
    try {
      const { name, email, password, speciality, degree, experience, about, fees, address } = req.body;
      const imageFile = req.file;
  
      //kontrollimi i datave per shtim doktorri
      if (!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address){
        return res.json({success:false,message:"Missing Details"})
      }

      //validating email format
      if(!validator.isEmail(email)){
        return res.json({success:false,message:"Please enter a valid email"})
      }

      //validim per pasword te rende
      if(password.length < 8){
        return res.json({success:false,message:"Please enter a strong password "})
      }
      if (!imageFile) {
        return res.json({ success: false, message: "Image file is required" });
      }
      

      //hashing password
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(password, salt)

      //upload image to cloudinary
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image"
      });      

      const doctorData = {
        name,email,image:imageUrl,password:hashedPassword,speciality,degree,experience,about,fees,address:JSON.parse(address),date:Date.now()

      }
      const newDoctor = new doctorModel(doctorData)
      await newDoctor.save()

  
      // Për testim, përgjigje bazë
      res.status(200).json({ message: "Doktori u shtua me sukses!" });
    } catch (error) {
      console.log(error)
      res.json({success:false,message:error.message})
    }
  };
  
  export { addDoctor };
  