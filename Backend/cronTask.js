import cron from 'node-cron';
import Test from './models/test.js';
import moment from 'moment';

// Planifier la tâche cron pour qu'elle s'exécute toutes les 3 heures
cron.schedule('0 * * * *', async () => {
  try {
    console.log("Vérification des tests pour mettre à jour le statut...");

    // Récupérer tous les tests qui ne sont pas encore complétés et qui ont une date planifiée et une durée
    const tests = await Test.find({
      status: { $ne: 'completed' },  // Ne prendre que les tests non complétés
      scheduledDate: { $exists: true },
      duration: { $exists: true }     // Vérifie que la durée existe pour le calcul
    });

    // Pour chaque test, on va vérifier si l'heure actuelle est après l'heure de fin
    for (let test of tests) {
      // Calcule le endTime en ajoutant la durée au scheduledDate
      const scheduledDate = new Date(test.scheduledDate);  // La date de début du test
      const durationInMilliseconds = test.duration * 60 * 1000;  // Convertir la durée en millisecondes
      const endTime = new Date(scheduledDate.getTime() + durationInMilliseconds);  // Calcul du endTime

      // Vérifie si l'heure actuelle est supérieure au endTime
      const currentTime = new Date();

      if (currentTime > endTime) {
        // Si l'heure actuelle est après le endTime, on marque le test comme "completed"
        await markTestAsCompleted(test._id);
        console.log(`Test ${test._id} marqué comme "completed"`);
      }
    }

    console.log("Vérification terminée.");
  } catch (err) {
    console.error("Erreur lors de la vérification des tests:", err.message);
  }
});

// Fonction pour marquer un test comme "completed"
async function markTestAsCompleted(testId) {
  try {
    const result = await Test.findByIdAndUpdate(testId, { status: 'completed' });
    if (result) {
      console.log(`Test ${testId} marqué comme "completed" avec succès.`);
    } else {
      console.error(`Test ${testId} non trouvé.`);
    }
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du test ${testId}:`, error.message);
  }
}
