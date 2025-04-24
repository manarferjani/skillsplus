import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import dotenv from 'dotenv';

// Import models
import User from './models/user.js';
import Manager from './models/manager.js';
import Collaborator from './models/collaborator.js';
import Admin from './models/admin.js';
import Test from './models/test.js';
import Technologie from './models/technology.js';
import Formation from './models/formation.js';
import Submission from './models/submission.js';
import testService from './services/test.service.js';
import Question from './models/question.js';


// Configuration
dotenv.config();
const MONGO_URI = "mongodb+srv://manarferjanii:skillBloom123@skillbloom.2djs7.mongodb.net/?retryWrites=true&w=majority&appName=skillBloom";

// Quantités à générer
const NB_TECHNOLOGIES = 10;
const NB_FORMATIONS_PAR_TECH = 3;
const NB_TESTS = 10;
const NB_ADMINS = 2;
const NB_MANAGERS = 10;
const NB_COLLABORATORS = 10;
//const NB_SUBMISSIONS = 10;


// Fonction pour calculer le temps passé
function calculateTimeSpent(start, end) {
  const diff = end - start;
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

async function seed() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('🔌 Connecté à MongoDB');

    // Nettoyage des collections
    /*console.log('🧹 Nettoyage des collections...');
    await Promise.all([
      User.deleteMany({}),
      Technologie.deleteMany({}),
      Formation.deleteMany({}),
      Test.deleteMany({}),
      Submission.deleteMany({}),
      Question.deleteMany({})
    ]);
    console.log('✅ Collections nettoyées');*/

    /*// 1. Génération des technologies
    console.log('🛠️  Création des technologies...');
    const technologies = [];
    for (let i = 0; i < NB_TECHNOLOGIES; i++) {
      const tech = await Technologie.create({
        name: faker.commerce.department(),
        description: faker.lorem.paragraph()
      });
      technologies.push(tech);
    }
    console.log(`✅ ${technologies.length} technologies créées`);

    // 2. Génération des formations
    console.log('🎓 Création des formations...');
    const formations = [];
    for (const tech of technologies) {
      for (let i = 0; i < NB_FORMATIONS_PAR_TECH; i++) {
        const formation = await Formation.create({
          title: `${faker.hacker.adjective()} ${faker.hacker.noun()} Formation`,
          description: faker.lorem.paragraphs(2),
          levelRequired: faker.number.int({ min: 1, max: 3 }),
          technology: tech._id,
          duration: faker.number.int({ min: 30, max: 180 }),
          isActive: faker.datatype.boolean()
        });
        formations.push(formation);
      }
    }
    console.log(`✅ ${formations.length} formations créées`);*/

    // 3. Création des utilisateurs
    console.log('👥 Création des utilisateurs...');
    const password = 'password123'; // Mot de passe commun pour tous les utilisateurs de test

    // Admins
    const admins = [];
    for (let i = 0; i < NB_ADMINS; i++) {
      const admin = await Admin.create({
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        password,
        role: 1,
        clerkId: faker.string.uuid(),
        managedRoles: [1, 2, 3]
      });
      admins.push(admin);
    }
    console.log(`✅ ${admins.length} admins créés`);

    // Managers
    const managers = [];
    for (let i = 0; i < NB_MANAGERS; i++) {
      const manager = await Manager.create({
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        password,
        role: 2,
        clerkId: faker.string.uuid(),
        department: faker.commerce.department()
      });
      managers.push(manager);
    }
    console.log(`✅ ${managers.length} managers créés`);

    // Collaborators
    const collaborators = [];
    for (let i = 0; i < NB_COLLABORATORS; i++) {
      const collaborator = await Collaborator.create({
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        password,
        role: 3,
        clerkId: faker.string.uuid(),
        skills: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }).map(() =>
          faker.helpers.arrayElement(['JavaScript', 'Python', 'Java', 'C#', 'PHP', 'Ruby'])
        ),
        level: faker.number.int({ min: 1, max: 10 })
      });
      collaborators.push(collaborator);
    }
    console.log(`✅ ${collaborators.length} collaborateurs créés`);

    /*// 4. Création des tests avec questions
    console.log('📝 Création des tests...');
    const tests = [];
    for (let i = 0; i < NB_TESTS; i++) {
      const randomTech = faker.helpers.arrayElement(technologies);
      const randomManager = faker.helpers.arrayElement(managers);
      //const questionCount = faker.number.int({ min: 20, max: 40 });
      //const questionCount =40;

      // Génération des questions
      const questions = [];
      const mapping = [
        {
          "level": "basic",
          "numberOfQuestions": 5,
          "numberofPointsperQuestion": 5
        },
        {
          "level": "intermediate",
          "numberOfQuestions": 10,
          "numberofPointsperQuestion": 10
        },
        {
          "level": "expert",
          "numberOfQuestions": 5,
          "numberofPointsperQuestion": 15
        }
      ]
      for (const mp of mapping) {
        for (let i = 0; i < mp["numberOfQuestions"]; i++) {
          questions.push({
            questionText: `${faker.hacker.phrase()}?`,
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: faker.helpers.arrayElement(['A', 'B', 'C', 'D']),
            level: mp["level"],
            points: mp["numberofPointsperQuestion"],
            technology: randomTech._id
          });
        }
      }
      const questionDocs = await Question.insertMany(
        questions.map(q => ({
          ...q,
        }))
      );


      // Création du test
      /*const test = await Test.create({
        title: `${faker.hacker.adjective()} ${randomTech.name} Test`,
        level: faker.number.int({ min: 1, max: 10 }),
        technology: randomTech._id,
        description: `Test d'évaluation sur ${randomTech.name}. ${faker.lorem.sentence()}`,
        scheduledDate: faker.date.future(),
        status: faker.helpers.arrayElement(['scheduled', 'completed', 'cancelled']),
        createdBy: randomManager._id,
        duration: faker.number.int({ min: 15, max: 120 }),
        questions: questionDocs.map(q => q._id), // Insert question IDs
        published: faker.datatype.boolean()
      });




      tests.push(test);
      console.log(`✅ Test créé avec ${test.questions.length} questions`);
    }
    console.log(`✅ ${tests.length} tests créés`);

    // Check if tests and collaborators exist
    if (!tests || tests.length === 0) {
      console.error('No tests found');
      return;
    }

    if (!collaborators || collaborators.length === 0) {
      console.error('No collaborators found');
      return;
    }

    /*console.log('📤 Création des soumissions...');
    const submissions = [];

    for (let i = 0; i < NB_SUBMISSIONS; i++) {
      const selectedTest = faker.helpers.arrayElement(tests);
      const collaborator = faker.helpers.arrayElement(collaborators);
      const startTime = faker.date.recent({ days: 30 });
      const endTime = new Date(startTime.getTime() + selectedTest.duration * 60000 * faker.number.float({ min: 0.5, max: 1.2 }));

      // Check if questions exist for the selected test
      // Ensure that the selected test has questions
      if (!selectedTest.questions || selectedTest.questions.length === 0) {
        console.error(`Test ${selectedTest._id} has no questions.`);
        continue;  // Skip this test if no questions exist
      }


      const populatedTest = await selectedTest.populate('questions');
      const questions = populatedTest.questions;
      const optionsList = questions.map(question => question.options);

      const responses = selectedTest.questions  
      .map(question => {
        if (!optionsList || optionsList.length === 0) {
          console.error(`Question ${question._id} has no options.`);
          return null;  // Skip this question
      }

          const chosenResponse = faker.helpers.arrayElement(question.options); // réponse aléatoire
          const isCorrect = chosenResponse === question.correctAnswer;        // vérifie si c'est la bonne

          return {
            questionId: question._id,
            response: chosenResponse,
            isCorrect
          };
        })
        .filter(response => response !== null);  // On enlève les questions sans options


      console.log(responses);


      // Calculate scores
      let basicScore = 0, intermediateScore = 0, expertScore = 0;
      responses.forEach((response, index) => {
        const question = selectedTest.questions.find(q => q._id.toString() === response.questionId.toString());
        if (question && response.response === question.correctAnswer) {
          if (index < 5) basicScore += 5;
          else if (index < 20) intermediateScore += 6;
          else expertScore += 5;
        }
      });

      const totalScore = basicScore + intermediateScore + expertScore;
      const maxScore = 25 + 90 + 100;
      const successRate = Math.round((totalScore / maxScore) * 100);

      // Create the submission
      const submission = await Submission.create({
        test: selectedTest._id,
        collaborator: collaborator._id,
        responses,
        startTime: new Date(),
        endTime,
        timeSpent: calculateTimeSpent(startTime, endTime),
       
        successRate: successRate,
        totalScore: 0,
        successRate: 0,
        basicScore: 0,
        intermediateScore: 0,
        expertScore: 0
      });

      // Update participation in the test
      selectedTest.participations.push({
        collaborator: collaborator._id,
        TotalScore: totalScore,
        successRate,
        startTime,
        endTime,
        timeSpent: (endTime - startTime) / 60000,
        basicScore,
        intermediateScore,
        expertScore
      });

      // Calculate averages
      selectedTest.averageScore = selectedTest.participations.reduce((sum, p) => sum + p.TotalScore, 0) / selectedTest.participations.length;
      selectedTest.averageSuccessRate = selectedTest.participations.reduce((sum, p) => sum + p.successRate, 0) / selectedTest.participations.length;

      await selectedTest.save();
      submissions.push(submission);
    }

    console.log(`✅ ${submissions.length} soumissions créées`);


    // 6. Mise à jour des collaborateurs avec les formations suivies
    console.log('🔄 Mise à jour des collaborateurs...');
    for (const collaborator of collaborators) {
      // Si vous utilisez les formations créées plus tôt, assurez-vous que la variable "formations" existe.
      // Ici, nous vérifions d'abord que "formations" est bien définie.
      if (formations && formations.length > 0) {
        const formationsToAdd = faker.helpers.arrayElements(
          formations,
          faker.number.int({ min: 0, max: 5 })
        );

        collaborator.formationsFollowed = formationsToAdd.map(formation => ({
          formationId: formation._id,
          date: faker.date.past(),
          status: faker.helpers.arrayElement(['completed', 'in_progress', 'abandoned'])
        }));

        await collaborator.save();
      }
    }
  
*/
    console.log('🎉 Seed terminé avec succès !');
  } catch (err) {
    console.error('❌ Erreur durant le seed :', err);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }

}
seed();