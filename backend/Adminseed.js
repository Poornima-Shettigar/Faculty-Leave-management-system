const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // 1. IMPORT BCRYPT
const User = require("./Models/User.js"); // 2. This is correct (it points to User.js)

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
    console.log("Checking User model for admin...");

    const exists = await User.findOne({ email: email });

    if (exists) {
      console.log(`Admin user '${email}' already exists.`);
      process.exit();
    }

    // 3. HASH THE PASSWORD
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("123", salt);

    await User.create({
      name: "Admin",
      email: email,
      password: hashedPassword, // 4. SAVE THE HASHED PASSWORD
      role: "admin",
      phone: "0000000000",
      departmentType: "Administrative",
      employeeType: "Administrative",
      dateOfJoining: "2024-01-01"
    });

    console.log(`✅ Default Admin Created: ${email} / 123`);
    process.exit();
  } catch (err) {
    console.log("❌ Seed Error:", err);
    process.exit();
  }
};