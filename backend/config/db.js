// config/db.js

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Fix: Proper MongoDB connection string
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://shiva:NhxmGt162tahD8mk@cluster1.ktltehj.mongodb.net/?appName=Cluster1');
    console.log(` MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(" Database connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;