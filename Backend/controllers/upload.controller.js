import express from 'express';
import upload from '../middleware/upload.js';
import { auth } from "../middleware/auth.js";
import User from '../models/user.js';

const router = express.Router();

router.post(
  "/uploadI",
  auth,
  upload.single("profileImage"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image file provided",
        });
      }

      const imagePath = `/images/uploads/${req.file.filename}`;
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { profileImage: imagePath },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Profile image updated successfully",
        imageUrl: imagePath,
      });
    } catch (err) {
      console.error("Error uploading image:", err);
      res.status(500).json({
        success: false,
        message: "Server error during image upload",
      });
    }
  }
);

export default router;
