import mongoose from 'mongoose';
import Test from './models/test.js';  // Remplace par ton chemin réel

async function updateTestLevels() {
  try {
    // Mise à jour pour '1' → 'junior'
    await Test.updateMany(
      { "level": '1' },  // Condition pour trouver les tests avec level = '1'
      { $set: { "level": 'junior' } }
    );

    // Mise à jour pour '2' → 'intermediaire'
    await Test.updateMany(
      { "level": '2' },  // Condition pour trouver les tests avec level = '2'
      { $set: { "level": 'intermediaire' } }
    );

    // Mise à jour pour '3' → 'senior'
    await Test.updateMany(
      { "level": '3' },  // Condition pour trouver les tests avec level = '3'
      { $set: { "level": 'senior' } }
    );

    // Mise à jour des questions pour refléter le même changement si nécessaire
    await Test.updateMany(
      { "questions.level": '1' },
      { $set: { "questions.$[elem].level": 'junior' } },
      { arrayFilters: [{ "elem.level": '1' }] }
    );

    await Test.updateMany(
      { "questions.level": '2' },
      { $set: { "questions.$[elem].level": 'intermediaire' } },
      { arrayFilters: [{ "elem.level": '2' }] }
    );

    await Test.updateMany(
      { "questions.level": '3' },
      { $set: { "questions.$[elem].level": 'senior' } },
      { arrayFilters: [{ "elem.level": '3' }] }
    );

    console.log('Mise à jour réussie des niveaux');
  } catch (err) {
    console.error('Erreur lors de la mise à jour des niveaux :', err);
  }
}

// Connexion à la base de données et exécution de la mise à jour
mongoose.connect('mongodb+srv://manarferjanii:skillBloom123@skillbloom.2djs7.mongodb.net/skillBloom', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    updateTestLevels();
  })
  .catch(err => {
    console.error('Erreur de connexion à la base de données :', err);
  });

