
import apiClient from "@/lib/api-client"; // Assurez-vous que le chemin est correct
import { AxiosResponse } from "axios";



// Fonction avec typage explicite pour les paramètres
export async function sendAnswer(
  testId: string,
  questionId: string,
  response: string | string[],
): Promise<AxiosResponse> {
  // Ajoutez ce log crucial
  console.log("Données avant envoi:", { testId, questionId, response });
  try {
    const data = {
      testId,
      questionId,
      response
    };

    return await apiClient.post('/api/submission/submission', data);
  } catch (error) {
    console.error("Erreur lors de l'envoi de la réponse :", error);
    throw error;
  }
}
export async function getSubmission(
  testId: string,
  collaboratorEmail: string
): Promise<AxiosResponse> {
  try {
    return await apiClient.get('/api/submission/getSubmission', {
      params: { testId, collaboratorEmail }
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de la soumission :", error);
    throw error;
  }
}
