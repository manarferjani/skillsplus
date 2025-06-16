import apiClient from "@/lib/api-client";// adapte le chemin selon ton arborescence

// ✅ Fonction pour récupérer tous les tests
export async function fetchTests(): Promise<any[]> {
  try {
    const response = await apiClient.get('/api/collaborators/getTests');
    const tests = response.data;
    console.log(tests);
    return tests;
  } catch (error) {
    console.error("Erreur lors de la récupération des tests :", error);
    throw error;
  }
}

// ✅ Fonction pour récupérer les résultats d'un test pour un collaborateur
export async function getCollaboratorResults(testId: string, collaboratorId: string): Promise<any> {
  try {
    const response = await apiClient.get(`/api/collaborators/results/${testId}/${collaboratorId}`);
    const result = response.data;

    console.log('Score:', result.score);
    console.log('Taux de réussite:', result.successRate);
    console.log('Temps passé:', result.timeSpent);
    console.log('Score par niveau :', {
      basicScore: result.basicScore,
      intermediateScore: result.intermediateScore,
      expertScore: result.expertScore
    });

    return result;
  } catch (error) {
    console.error('Erreur lors de la récupération des résultats:', error);
    throw error;
  }
}

// ✅ Fonction pour récupérer le temps passé sur un test
export async function getTimeSpent(testId: string, collaboratorId: string): Promise<number> {
  try {
    const response = await apiClient.get(`/api/collaborators/timeSpent/${testId}/${collaboratorId}`);
    return response.data.timeSpent;
  } catch (error) {
    console.error('Erreur lors de la récupération du temps passé:', error);
    throw error;
  }
}

// ✅ Fonction pour récupérer l’historique du taux de réussite par technologie
export async function getSuccessHistory(collaboratorId: string, technologyId: string): Promise<any[]> {
  try {
    const response = await apiClient.get(`/api/collaborators/${collaboratorId}/technology/${technologyId}/success-history`);
    const history = response.data;
    console.log("Historique du taux de réussite :", history);
    return history;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique :", error);
    throw error;
  }
}

// ✅ Fonction pour récupérer tous les collaborateurs
export async function getAllCollaborators(): Promise<any[]> {
  try {
    const response = await apiClient.get('/api/collaborators/basic');
    const collaborators = response.data;
    console.log("Collaborateurs récupérés :", collaborators);
    return collaborators;
  } catch (error) {
    console.error("Erreur lors de la récupération des collaborateurs :", error);
    throw error;
  }
}
