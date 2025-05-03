
import mongoose from "mongoose";

const connectDB=async()=>{

    mongoose.connection.on('connected',()=>console.log("Database Connect"))

      await mongoose.connect(`${process.env.MONGODB_URI}/ProjektiLab`)


}

export default connectDB