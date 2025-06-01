// frontend/src/services/test.service.tsx
import apiClient from "@/lib/api-client"; // Assurez-vous que le chemin est correct

/**
 * Récupère la liste des tests pour le calendrier via l'endpoint GET /api/tests/getCalendarTests.
 */
export async function fetchTests() {
  try {
    const response = await apiClient.get('/api/tests/getCalendarTests');
    const calendarTests = response.data.data;
    console.log("Tests récupérés :", calendarTests);
    return calendarTests;
  } catch (error) {
    console.error("Erreur lors de la récupération des tests :", error);
    throw error;
  }
}

/**
 * Récupère tous les tests via l'endpoint GET /api/tests/getFormattedTests.
 */
export async function fetchFormattedTests() {
  try {
    const response = await apiClient.get('/api/tests/getFormattedTests');
    const allTests = response.data.data;
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
 * @param collaboratorId - L'identifiant du collaborateur.
 */
export async function startTest(testId: string, collaboratorId: string) {
  try {
    const response = await apiClient.post(`/api/tests/startTest/${testId}/join`, { collaboratorId });
    console.log("Participation enregistrée :", response.data);
    return response.data;
  } catch (error) {
    console.error("Erreur lors du démarrage du test :", error);
    throw error;
  }
}

/**
 * Récupère l'historique des tests d'un collaborateur via l'endpoint GET /api/tests/history/:collaboratorId.
 * @param collaboratorId - L'identifiant du collaborateur.
 */
export async function getUserTestHistory(collaboratorId: string) {
  try {
    const response = await apiClient.get(`/api/tests/history/${collaboratorId}`);
    const testHistory = response.data;
    console.log("Historique des tests du collaborateur :", testHistory);
    return testHistory;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique des tests :", error);
    throw error;
  }
}

// Optionnel : Supprime ceci si ce n'est pas souhaité automatiquement au chargement
// fetchTests();

/**
 * Récupère les questions d'un test pour l'interface quiz via l'endpoint GET /api/tests/:id/questions.
 * @param testId - L'identifiant du test dont on souhaite charger les questions.
 */
export async function fetchQuiz(testId: string) {
  try {
    // Appel à l'API pour récupérer les questions du test
    const response = await apiClient.get(`/api/tests/${testId}/questions`)
    
    // Log des données reçues (optionnel, utile pour le débogage)
    const quizData = response.data.data || response.data // Selon la structure de votre backend
    console.log("Questions récupérées :", quizData)
    
    // Retourne les données du quiz
    return quizData
  } catch (error) {
    // Gestion des erreurs et log détaillé
    console.error("Erreur lors de la récupération du quiz :", error)
    throw error
  }
}
/**
 * Récupère les moyennes des tests de cette semaine via l'endpoint GET /api/tests/averages.
 */
export async function fetchTestAveragesThisWeek() {
  try {
    const response = await apiClient.get(`/api/tests/averages`);

    const testAverages = response.data;
    console.log("Moyennes des tests récupérées :", testAverages);
    return testAverages;
  } catch (error) {
    console.error("Erreur lors de la récupération des moyennes des tests :", error);
    throw error;
  }
}


export const deleteTest = async (testId: string): Promise<void> => {
  try {
    await apiClient.delete(`/api/tests/${testId}`)
  } catch (error) {
    console.error(`Erreur lors de la suppression du test ${testId}`, error)
    throw error
  }
}
/**
 * Récupère un test par son ID via l'endpoint GET /api/tests/getTestById/:id
 * @param testId - L'ID du test à récupérer
 */
export async function getTestById(testId: string, p0: { signal: AbortSignal; }): Promise<any> {
  try {
    const response = await apiClient.get(`/api/tests/getTestById/${testId}`)
    console.log('Test récupéré avec succès :', response.data)
    return response.data
  } catch (error) {
    console.error(`Erreur lors de la récupération du test ${testId}`, error)
    throw error
  }
}
import { AxiosError } from 'axios';

interface TechnologyRef {
  _id: string;
  name: string;
}

interface TestQuestion {
  questionText: string;
  options: string[];
  points: number;
  type: 'single' | 'multiple' | 'code';
  correctAnswer?: string;
  correctAnswers?: string[];
  level: string;
}

interface TestUpdateData {
  title: string;
  level: string;
  technology: string; // Doit être l'ID de la technologie
  description?: string;
  scheduledDate?: string;
  duration: number;
  questions: TestQuestion[];
}

export async function updateTest(
  testId: string,
  updatedData: TestUpdateData
): Promise<any> {
  try {
    // Validation de l'ID de technologie
    if (!isValidMongoId(updatedData.technology)) {
      throw new Error("L'ID de la technologie n'est pas valide");
    }

    const payload = {
      ...updatedData,
      questions: updatedData.questions.map((q) => ({
        questionText: q.questionText,
        options: q.options.filter((opt: string) => opt.trim() !== ''),
        points: q.points,
        type: q.type,
        correctAnswer: q.type === 'single' ? q.correctAnswer : undefined,
        correctAnswers: q.type === 'multiple' ? q.correctAnswers : undefined,
        level: q.level || 'basic'
      }))
    };

    const response = await apiClient.put(`/api/tests/update/${testId}`, payload, {
      validateStatus: (status) => status < 500
    });

    if (response.status >= 400) {
      throw new Error(response.data.message || `Erreur ${response.status}`);
    }

    return response.data;
  } catch (error: unknown) {
    let errorMessage = 'Erreur lors de la mise à jour du test';
    let errorDetails: any = null;

    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (isAxiosError(error)) {
        errorDetails = error.response?.data;
        errorMessage = errorDetails?.message || error.message;
        
        // Cas spécifique pour les erreurs de validation MongoDB
        if (errorDetails?.error?.includes('Cast to ObjectId failed')) {
          errorMessage = "La technologie sélectionnée n'est pas valide";
        }
      }
    }

    console.error('Erreur détaillée:', {
      message: errorMessage,
      details: errorDetails,
      payload: updatedData
    });

    throw new Error(errorMessage);
  }
}

// Helper pour valider les IDs MongoDB
function isValidMongoId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

// Type guard pour AxiosError
function isAxiosError(error: any): error is AxiosError {
  return error.isAxiosError === true;
}