export interface Performer {
    collaborateurNom: string;
    technologie: string;
    scoreEvolution: number;
    successRate: number;
  }
export interface PerformersOfTheWeekProps {
    performers: Performer[];
   
  }