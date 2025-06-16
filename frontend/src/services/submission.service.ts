import axios from 'axios';

// Définition des types pour les paramètres
interface AnswerData {
  testId: string; // L'ID du test
  collaboratorId: string; // L'ID du collaborateur
  questionText: string; // texte de la question
  answer: string; // La réponse donnée par le collaborateur
}

// Fonction avec typage explicite pour les paramètres
async function sendAnswer(testId: string, collaboratorId: string, questionText: string, answer: string): Promise<void> {
  try {
    // Préparation des données à envoyer
    const data: AnswerData = {
      testId: testId,
      collaboratorId: collaboratorId,
      questionText: questionText,
      answer: answer
    };

    // Envoi de la requête POST pour ajouter ou modifier la réponse
    const response = await axios.post('/api/submission', data);

    // Si la réponse est ajoutée ou modifiée avec succès
    console.log("Réponse ajoutée ou modifiée avec succès :", response.data);

    // Vous pouvez ici mettre à jour l'interface utilisateur si nécessaire
    // Par exemple, afficher un message de confirmation ou rediriger l'utilisateur

  } catch (error) {
    console.error("Erreur lors de l'ajout ou de la modification de la réponse :", error);
    // Vous pouvez aussi afficher un message d'erreur à l'utilisateur si quelque chose échoue
  }
}
