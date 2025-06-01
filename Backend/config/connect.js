import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = "mongodb+srv://manarferjanii:skillBloom123@skillbloom.2djs7.mongodb.net/?retryWrites=true&w=majority&appName=skillBloom";

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connexion à MongoDB réussie");
  } catch (error) {
    console.error("❌ Erreur de connexion à MongoDB :", error);
  }
};
