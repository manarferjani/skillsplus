import axios from "axios";

export interface Performer {
  collaborateurNom: string;
  technologie: string;
  scoreEvolution: number;
  successRate: number;
}

// Récupère les performers de la semaine depuis le backend
export async function fetchPerformersOfTheWeek(): Promise<Performer[]> {
  try {
    const response = await axios.get('http://localhost:5173/api/performer/getPerformersOfTheWeek');
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération des performers :", error);
    throw error;
  }
}

// Déclenche manuellement la mise à jour des performers (peut être utilisée par un admin)
export async function updatePerformersOfTheWeek(): Promise<void> {
  try {
    await axios.post('http://localhost:5173/api/performer/updatePerformersOfTheWeek');
    console.log("Performers mis à jour avec succès");
  } catch (error) {
    console.error("Erreur lors de la mise à jour des performers :", error);
    throw error;
  }
}
