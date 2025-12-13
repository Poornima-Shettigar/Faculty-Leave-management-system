// config/db.js

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect('mongodb+srv://shiva:NhxmGt162tahD8mk@cluster1.ktltehj.mongodb.net/?appName=Cluster1');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Database connection failed ❌");
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;