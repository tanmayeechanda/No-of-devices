// fixPasswords.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js"; // make sure this path is correct

dotenv.config();

async function fixPasswords() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb+srv://tanmayee:tanmayee123@no-of-devices.ewrtxil.mongodb.net/?retryWrites=true&w=majority&appName=No-of-Devices"
    );
    console.log("✅ Connected to MongoDB");

    const users = await User.find();

    for (const user of users) {
      if (!user.password.startsWith("$2a$")) {
        const hashed = await bcrypt.hash(user.password, 12);
        user.password = hashed;
        await user.save();
        console.log(`🔐 Password hashed for: ${user.email}`);
      } else {
        console.log(`✅ Already hashed: ${user.email}`);
      }
    }

    console.log("🎉 All user passwords updated successfully.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to fix passwords:", err);
    process.exit(1);
  }
}

fixPasswords();
