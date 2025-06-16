//frontend/src/services/collaborator.service.tsx
import axios from "axios";

// Assurez-vous d'avoir inclus axios dans votre projet (via une balise <script> ou en l'installant via npm/yarn)
async function fetchTests() {
    try {
      // La méthode axios.get() envoie une requête GET à l'URL spécifiée
      const response = await axios.get('/api/collaborators/getTests');
      
      // Avec axios, la réponse attendue se trouve dans response.data
      const tests = response.data;
      
      // Affichage ou traitement des tests dans l'interface
      console.log(tests);
    } catch (error) {
      console.error("Erreur lors de la récupération des tests :", error);
      // Gestion d'erreur côté utilisateur (affichage d'un message, etc.)
    }
  }

  async function getCollaboratorResults(testId: string, collaboratorId: string): Promise<any> {
    try {
      // Faire une requête GET pour récupérer les résultats
      const response = await fetch(`/api/collaborator/results/${testId}/${collaboratorId}`);
  
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des résultats');
      }
  
      // Convertir la réponse en JSON
      const result = await response.json();
  
      // Afficher ou utiliser les résultats dans le frontend
      console.log('Score:', result.score);
      console.log('Taux de réussite:', result.successRate);
      console.log('Temps passé:', result.timeSpent);
      console.log('Score par niveau de difficulté :', {
        basicScore: result.basicScore,
        intermediateScore: result.intermediateScore,
        expertScore: result.expertScore
      });
  
      // Vous pouvez maintenant utiliser ces résultats dans votre UI
      return result;
    } catch (error) {
      console.error(error);
      throw error; // Ajouter cette ligne pour propager l'erreur
    }
  }
  
  // Exemple d'appel à la fonction
  const testId = 'test123'; // L'ID du test
  const collaboratorId = 'collab123'; // L'ID du collaborateur
  getCollaboratorResults(testId, collaboratorId);

  
  // New function to call the API for time spent
async function getTimeSpent(testId: string, collaboratorId: string): Promise<number> {
  try {
    const response = await axios.get(`/api/collaborator/timeSpent/${testId}/${collaboratorId}`);
    
    if (response.status === 200) {
      // Assuming the time spent is in the response body
      return response.data.timeSpent;
    } else {
      throw new Error('Impossible de récupérer le temps passé');
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du temps passé:', error);
    throw error; // Rethrow for further handling if needed
  }
}
  
  // Appel de la fonction au chargement de la page ou suite à une action de l'utilisateur
  fetchTests();
  