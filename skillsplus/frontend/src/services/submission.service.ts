
import apiClient from "@/lib/api-client"; // Assurez-vous que le chemin est correct
import { AxiosResponse } from "axios";

// Définition des types pour les paramètres
interface AnswerData {
  testId: string; // L'ID du test
  questionText: string; // texte de la question
  response: string | string[]; // La réponse donnée par le collaborateur
}

// Fonction avec typage explicite pour les paramètres
export async function sendAnswer(
  testId: string,
  questionText: string,
  response: string | string[]
): Promise<AxiosResponse> {
  try {
    const data = {
      testId,
      questionText,
      response
    };

    return await apiClient.post('/api/submission/submission', data);
  } catch (error) {
    console.error("Erreur lors de l'envoi de la réponse :", error);
    throw error;
  }
}
