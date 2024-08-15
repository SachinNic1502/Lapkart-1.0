const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const multer = require("multer");
const cloudinary = require("../config/cloudinaryConfig");
const verifyToken = require("../middlewares/authMiddleware");

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Get user details
router.get("/user/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Route to update user details including profile image
router.put("/user/me", verifyToken, upload.single("profileImg"), async (req, res) => {
    try {
      const { fullName, email, phoneNumber } = req.body;
      let profileImgUrl = req.body.profileImgUrl;
  
      // Upload profile image to Cloudinary
      if (req.file) {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream({ folder: "profile_pictures" }, (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }).end(req.file.buffer);
        });
        profileImgUrl = result.secure_url;
      }
  
      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { fullName, email, phoneNumber, profileImg: profileImgUrl },
        { new: true }
      ).select("-password");
  
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found." });
      }
  
      res.json(updatedUser);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error" });
    }
  });
// Create a new user
router.post("/user", async (req, res) => {
  try {
    const { fullName, email, password, phoneNumber, profileImg, active } =
      req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      phoneNumber,
      profileImg,
      active,
    });

    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user by ID
router.get("/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete user
router.delete("/user/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Additional endpoint for profile image upload
router.post("/user/profile/upload", verifyToken, upload.single("profileImg"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
  
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder: "profile_pictures" }, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }).end(req.file.buffer);
      });
  
      // Update user with the new profile image URL
      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { profileImg: result.secure_url },
        { new: true }
      ).select("-password");
  
      res.json({ profilePicture: updatedUser.profileImg });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error during image upload" });
    }
  });
  
module.exports = router;
