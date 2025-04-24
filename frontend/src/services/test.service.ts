// frontend/src/services/test.service.tsx
import axios from "axios";

/**
 * Récupère la liste des tests pour le calendrier via l'endpoint GET /api/tests/getCalendarTests.
 */
export async function fetchTests() {
  try {
    // La méthode axios.get() envoie une requête GET à l'URL spécifiée
    const response = await axios.get('/api/tests/getCalendarTests');

    console.log("Données reçues:", response.data.data);
    
    // Avec axios, la réponse attendue se trouve dans response.data
    const calendarTests = response.data.data;
    
    // Affichage ou traitement des tests dans l'interface
    console.log("Tests récupérés :", calendarTests);
    return calendarTests;
  } catch (error) {
    console.error("Erreur lors de la récupération des tests :", error);
    // Vous pouvez, par exemple, renvoyer un objet d'erreur pour être géré côté composant
    throw error;
  }
}
/**
 * Récupère tous les tests via l'endpoint GET /api/tests.
 */
export async function fetchFormattedTests() {
  try {
    // Appel de l'API pour récupérer tous les tests
    const response = await axios.get('/api/tests/getFormattedTests');
    
    // Traitement des tests récupérés
    const allTests = response.data.data; // pas juste response.data

    
    // Affichage ou traitement des tests dans l'interface
    console.log("Formatted tests récupérés :", allTests);
    
    return allTests;
  } catch (error) {
    console.error("Erreur lors de la récupération de tous les tests :", error);
    throw error;
  }
}

/**
 * Démarre un test pour un collaborateur en appelant l'endpoint POST /api/tests/startTest/:id/join.
 * @param testId - L'identifiant du test à démarrer.
 * @param collaboratorId - L'identifiant du collaborateur qui démarre le test.
 */
export async function startTest(testId: string, collaboratorId: string) {
  try {
    // Envoie une requête POST pour enregistrer la participation
    const response = await axios.post(`/api/tests/startTest/${testId}/join`, { collaboratorId });
    
    // Affichage et retour de la réponse
    console.log("Participation enregistrée :", response.data);
    return response.data;
  } catch (error) {
    console.error("Erreur lors du démarrage du test :", error);
    throw error;
  }
}



// Appel de la fonction fetchTests() lors du chargement de la page ou d'une action utilisateur
fetchTests();
