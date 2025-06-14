import apiClient from "@/lib/api-client";// adapte le chemin selon ton arborescence

import axios, { AxiosError } from 'axios';

class TechnologyService {



  async getFilteredTechnologies() {
    try {
      const response = await apiClient.get('/api/technologies/getFilteredTech');
      return response.data;  // Cela retournera juste les noms des technologies
    } catch (error) {
      throw new Error("Erreur lors de la récupération des technologies");
    }
  }

  async getTechnologies() {
    try {
      const response = await apiClient.get('/api/technologies/getall');
      return response.data;  // Cela retournera juste les noms des technologies
    } catch (error) {
      throw new Error("Erreur lors de la récupération des technologies");
    }
  }
  // ✅ Fonction pour récupérer toutes les technologies
  async getAllTechnologies(): Promise<any[]> {
    try {
      const response = await apiClient.get('/api/technologies/basic');
      const technologies = response.data;
      console.log("Technologies récupérées :", technologies);
      return technologies;
    } catch (error) {
      console.error("Erreur lors de la récupération des technologies :", error);
      throw error;
    }
  }
    async getTechnologyYearlyAverages(technologyId: string, year?: number): Promise<{
    map(arg0: (avg: { month: any; averageSuccessRate: any; }) => { date: string; successRate: any; }): unknown;
    averageScore: number | null;
    averageSuccessRate: number | null;
    testCount: number;
    year: number;
  }> {
    try {
      let url = `/api/technologies/${technologyId}/yearly-averages`;
      if (year) {
        url += `/${year}`;
      }

      const response = await apiClient.get(url);
      return response.data.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error("Erreur lors de la récupération des moyennes annuelles:", error.message);
        throw new Error(
          error.response?.data?.message || 
          "Erreur lors de la récupération des statistiques de la technologie"
        );
      }
      throw new Error("Erreur inconnue lors de la récupération des statistiques");
    }
  }
}
  



export default new TechnologyService();
