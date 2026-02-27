const express = require("express");
const router = express.Router();
const User = require("../Models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Department = require("../Models/Department");

router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    console.log("Login Attempt:", { email, role });

    // Match user based on email + role
    const user = await User.findOne({ email, role });

    if (!user) {
      console.log("User not found for:", { email, role });
      return res.status(400).json({
        success: false,
        message: "Invalid email or role"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log("Invalid password for:", email);
      return res.status(400).json({
        success: false,
        message: "Invalid password"
      });
    }

    // Populate department info if needed
    const userData = await User.findById(user._id).populate("departmentType");

    // Generate JWT
    const token = jwt.sign(
      { id: userData._id, role: userData.role },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "1d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: userData._id,
        _id: userData._id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        phone: userData.phone,
        dateOfJoining: userData.dateOfJoining,
        // Provide both the object and the plain string ID
        departmentType: userData.departmentType
          ? {
            _id: userData.departmentType._id?.toString(),
            departmentName: userData.departmentType.departmentName,
            level: userData.departmentType.level,
          }
          : null,
        // Easy-to-use string ID for URL params
        departmentId: userData.departmentType?._id?.toString() || null,
      }
    });
  } catch (err) {
    console.error("Login route error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

module.exports = router;

