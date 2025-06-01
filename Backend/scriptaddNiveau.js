import mongoose from 'mongoose';
import Collaborator from './models/collaborator.js'; // Bien utiliser le modèle avec discriminator

// Connexion à la base
mongoose.connect('mongodb://localhost:27017/skillsplus')
  .then(() => {
    console.log('Connexion réussie à la base de données');
    assignRandomNiveaux();
  })
  .catch((err) => {
    console.error('Erreur de connexion à la base:', err);
  });

async function assignRandomNiveaux() {
  const niveaux = ['junior', 'intermediaire', 'senior'];
  const collaborateurs = await Collaborator.find();
  let count = 0;

  for (const collab of collaborateurs) {
    const randomNiveau = niveaux[Math.floor(Math.random() * niveaux.length)];
    collab.niveau = randomNiveau;
    await collab.save();
    console.log(`${collab.email} => ${randomNiveau}`);
    count++;
  }

  console.log(`${count} collaborateurs ont été mis à jour avec un niveau aléatoire.`);
  mongoose.connection.close();
}
