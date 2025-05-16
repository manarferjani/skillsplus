// frontend/src/services/performer.service.tsx
import apiClient from "@/lib/api-client";


interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}
interface TechnologyId {
  _id: string;
  name: string;
}


interface SuccessRateHistory {
  successRate: number;
  date: Date;
}

interface TechnologySuccessRate {
  technologyId: TechnologyId;
  history: SuccessRateHistory[];
}

interface PerformerOfTheWeek {
  technologyId: TechnologyId;
  technologyName: string;
  successRateBefore: number;
  successRateAfter: number;
  date: Date;
}

export interface Performer {
  _id: string;
  name: string;
  //profilePicture?: string;
  jobPosition?: string;
  technology_success_rate: TechnologySuccessRate[];
  performerOfTheWeek: PerformerOfTheWeek;
}

interface FetchPerformersOptions {
  filter?: 'all' | 'current' | 'past';
  limit?: number;
  sortBy?: 'improvement' | 'date' | 'successRate';
}

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('response' in error || 'message' in error)
  );
}

function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.response?.data?.message || error.message || 'Unknown error';
  }
  return 'An unknown error occurred';
}

function transformPerformerData(performer: any): Performer {
  return {
    ...performer,
    performerOfTheWeek: {
      ...performer.performerOfTheWeek,
      date: new Date(performer.performerOfTheWeek.date),
      technologyName: performer.performerOfTheWeek.technologyName || 'Inconnue'
    },
    technology_success_rate: performer.technology_success_rate?.map((tech: any) => ({
      ...tech,
      history: tech.history?.map((item: any) => ({
        ...item,
        date: new Date(item.date)
      })) || []
    })) || []
  };
}

export const PerformerService = {
  async fetchPerformers(options: FetchPerformersOptions = {}): Promise<Performer[]> {
    try {
      const params = new URLSearchParams();
      
      if (options.filter) params.append('filter', options.filter);
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.sortBy) params.append('sortBy', options.sortBy);

      const response = await apiClient.get(`api/collaborators/performers?${params.toString()}`);
      
      if (!Array.isArray(response.data)) {
        throw new Error('Invalid response format: expected an array of performers');
      }

      return response.data.map(transformPerformerData);
    } catch (error: unknown) {
      console.error("Error fetching performers:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  async getPerformerDetails(performerId: string): Promise<Performer> {
    try {
      if (!performerId) {
        throw new Error('Performer ID is required');
      }

      const response = await apiClient.get(`api/collaborators/performers/${performerId}`);
      
      if (!response.data) {
        throw new Error('Performer not found');
      }

      return transformPerformerData(response.data);
    } catch (error: unknown) {
      console.error("Error fetching performer details:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  async getTopPerformers(limit: number = 5): Promise<Performer[]> {
    try {
      const response = await apiClient.get(`api/collaborators/performers/top?limit=${limit}`);
      
      if (!Array.isArray(response.data)) {
        throw new Error('Invalid response format: expected an array of performers');
      }

      return response.data.map(transformPerformerData);
    } catch (error: unknown) {
      console.error("Error fetching top performers:", error);
      throw new Error(getErrorMessage(error));
    }
  }
};

export default PerformerService;