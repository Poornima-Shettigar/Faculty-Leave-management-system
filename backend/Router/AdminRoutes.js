const express = require("express");
const Admin = require("../Models/Admin");

const router = express.Router();

// ========================
// ADMIN LOGIN
// ========================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(400).json({ message: "User does not exist" });
    }

    if (admin.password !== password) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    res.status(200).json({
      message: "Login successful",
      name: admin.name,
      email: admin.email,
      role: admin.role
    });

  } catch (err) {
    console.error("ADMIN LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
