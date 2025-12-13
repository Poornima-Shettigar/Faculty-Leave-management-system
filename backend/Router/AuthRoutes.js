const express = require("express");
const router = express.Router();
const User = require("../Models/User");
const bcrypt = require("bcryptjs");

router.post("/login", async (req, res) => {
    const users = await User.find({});
console.log("All Users:", users);

  try {
    const { email, password, role } = req.body;
console.log("Received Body:", req.body);

    // Match user based on email + role
    const user = await User.findOne({ email ,role});
console.log(user);
    if (!user) {
      return res.status(400).json({ message: `Invalid email or role ${req.body}`});
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

   res.status(200).json({
      message: "Login successful",
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentType: user.departmentType || null // important!
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
