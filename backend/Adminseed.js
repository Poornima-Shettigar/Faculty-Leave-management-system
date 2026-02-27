const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // 1. IMPORT BCRYPT
const User = require("./Models/User.js");
const Admin = require("./Models/Admin.js");

mongoose.connect("mongodb+srv://shiva:NhxmGt162tahD8mk@cluster1.ktltehj.mongodb.net/?appName=Cluster1")
  .then(() => {
    console.log("✅ MongoDB Connected");
    insertAdmin();
  })
  .catch((err) => {
    console.log("❌ DB Connection Error:", err);
  });

const insertAdmin = async () => {
  try {
    const email = "shiva1@gmail.com";
    console.log("Seeding admin...");

    // Seed User model
    const userExists = await User.findOne({ email });
    if (!userExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("123", salt);
      await User.create({
        name: "Admin User",
        email: email,
        password: hashedPassword,
        role: "admin",
        phone: "0000000000",
        departmentType: new mongoose.Types.ObjectId(), // Just a placeholder if needed
        dateOfJoining: "2024-01-01"
      });
      console.log(`✅ User Admin Created: ${email} / 123`);
    }

    // Seed Admin model
    const adminExists = await Admin.findOne({ email });
    if (!adminExists) {
      await Admin.create({
        name: "Super Admin",
        email: email,
        password: "123", // Admin model uses plain text in its current login logic
        role: "Admin"
      });
      console.log(`✅ Admin Model Created: ${email} / 123`);
    }

    process.exit();
  } catch (err) {
    console.log("❌ Seed Error:", err);
    process.exit();
  }
};