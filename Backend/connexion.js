// test-mongo.js
import mongoose from "mongoose";

const uri = "mongodb://localhost:27017/skillBloom"; // ou depuis process.env

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("✅ Connexion MongoDB réussie !");
  process.exit(0);
})
.catch((err) => {
  console.error("❌ Connexion MongoDB échouée :", err);
  process.exit(1);
});
