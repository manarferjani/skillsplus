import TestModel from '../models/test.js';
import GlobalStats from '../models/globalStats.js';

const updatePerformersOfTheWeek = async () => {
  try {
    // 1. Peupler uniquement les champs nécessaires pour éviter les données inutiles
    const tests = await TestModel.find({})
      .populate({ path: 'technology', select: 'name' }) // on veut juste le nom de la technologie
      .populate({ path: 'participations.user', select: 'name email role' }); // on veut le nom de l'utilisateur
      console.log("testss",tests); 
    let performers = [];

    for (const test of tests) {
      const technologyNom = test.technology?.name ?? null;
      const participations = test.participations;

      for (const participation of participations) {
        const collaborateurNom = participation.user?.name ?? null;
        const successRate = participation.successRate ?? 0;
        const previousSuccessRate = participation.previousSuccessRate ?? 0;

        const scoreDiff = successRate - previousSuccessRate;
        const rateImproved = previousSuccessRate > 0
          ? (scoreDiff / previousSuccessRate >= 0.15)
          : scoreDiff >= 10;

        if (scoreDiff >= 10 || rateImproved) {
          performers.push({
            collaborateurNom,
            technologie: technologyNom,
            scoreEvolution: scoreDiff,
            successRate
          });
        }
      }
    }

    // 2. Trier les meilleurs performers d'abord
    performers.sort((a, b) => b.scoreEvolution - a.scoreEvolution);

    // 3. Mettre à jour ou insérer dans GlobalStats
    await GlobalStats.findOneAndUpdate(
      { type: 'performerOfWeek' },
      {
        value: performers,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    console.log("✅ Performers of the week updated:", performers);
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour des performers:", error);
  }
};

export default { updatePerformersOfTheWeek };
