import mongoose from 'mongoose';
import User from './models/user.js'; // Assure-toi que le chemin vers ton modèle est correct

mongoose.connect('mongodb+srv://manarferjanii:skillBloom123@skillbloom.2djs7.mongodb.net/?retryWrites=true&w=majority&appName=skillBloom', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(async () => {
    const users = await User.find(); // Récupère tous les utilisateurs existants

    for (let user of users) {
      if (!user.username) {
        // Générer un nom d'utilisateur à partir de l'email
        let baseUsername = user.email.split('@')[0]; // Prendre la partie avant le @ de l'email
        let username = baseUsername;

        // Vérifier si le nom d'utilisateur existe déjà
        let existingUser = await User.findOne({ username });
        let counter = 1;
        while (existingUser) {
          // Si le nom d'utilisateur existe déjà, ajouter un suffixe numérique
          username = `${baseUsername}_${counter}`;
          existingUser = await User.findOne({ username });
          counter++;
        }

        // Mettre à jour le nom d'utilisateur pour cet utilisateur
        user.username = username;

        // Sauvegarder l'utilisateur avec le nouveau username
        await user.save();
      }
    }

    console.log('Mise à jour des utilisateurs terminée.');
    mongoose.connection.close();
  })
  .catch(err => console.log('Erreur de connexion à la base de données:', err));
