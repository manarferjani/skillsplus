import mongoose from 'mongoose';

mongoose.connect('mongodb+srv://manarferjanii:skillBloom123@skillbloom.2djs7.mongodb.net/?retryWrites=true&w=majority&appName=skillBloom', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log("✅ Connexion réussie à MongoDB");
    process.exit();
  })
  .catch((err) => {
    console.error("❌ Échec de la connexion à MongoDB:", err.message);
    process.exit(1);
  });
