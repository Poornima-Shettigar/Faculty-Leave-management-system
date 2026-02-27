const express = require("express");
const Admin = require("../Models/Admin");
const jwt = require("jsonwebtoken");

const router = express.Router();

// ========================
// ADMIN LOGIN
// ========================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(400).json({ success: false, message: "User does not exist" });
    }

    if (admin.password !== password) {
      return res.status(401).json({ success: false, message: "Incorrect password" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "1d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      admin: {
        name: admin.name,
        email: admin.email,
        role: admin.role.toLowerCase()
      }
    });

  } catch (err) {
    console.error("ADMIN LOGIN ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
