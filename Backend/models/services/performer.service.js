// services/performer.service.js
import TestModel from '../models/test.js';
import GlobalStats from '../models/globalStats.js';

const updatePerformersOfTheWeek = async () => {
  const tests = await TestModel.find({});
  let performers = [];

  for (const test of tests) {
    const technology = test.technologie;
    const participations = test.participations;

    for (const participation of participations) {
      const collaborateurNom = participation.collaborateurNom;
      const successRate = participation.successRate;
      const previousSuccessRate = participation.previousSuccessRate || 0;

      const scoreDiff = successRate - previousSuccessRate;
      const rateImproved = previousSuccessRate > 0
        ? (scoreDiff / previousSuccessRate >= 0.15)
        : scoreDiff >= 10;

      if (scoreDiff >= 10 || rateImproved) {
        performers.push({
          collaborateurNom,
          technologie: technology,
          scoreEvolution: scoreDiff,
          successRate
        });
      }
    }
  }

  await GlobalStats.findOneAndUpdate(
    { type: 'performerOfWeek' },
    {
      value: performers,
      updatedAt: new Date()
    },
    { upsert: true, new: true }
  );

  console.log("Performers of the week updated:", performers);
};

export default { updatePerformersOfTheWeek };
