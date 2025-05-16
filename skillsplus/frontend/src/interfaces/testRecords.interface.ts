export interface FormattedParticipation {
  collaborateurNom: string;
  collaborateurEmail: string;
  totalScore: number;
  successRate: number;
  timeSpent: number;
}

export interface TestRecord {
  status: string;
  id: string;
  title: string;
  technologie: string;
  duration: number;
  scheduledDate: Date | null;
  averageScore: number;
  averageSuccessRate: number;
  participations: FormattedParticipation[];
}

export interface TimeSpentRadialProps {
  testRecords: TestRecord[];       // Liste des tests passée en prop
  maxTime: number;                 // Temps maximum de référence pour le test
  collaborateurFilter: string;     // Valeur du filtre collaborateur passée en prop
  technologieFilter: string;       // Valeur du filtre technologie passée en prop
}
export interface ScheduledTest {
  _id: string;
  title: string;
  scheduledDate: string; // ou Date selon ce que tu envoies
  joinable: boolean;
  startTime: string;
  endTime: string;
  timeRange: string;
  duration?: number;
  technology?: {
    _id: string;
    name: string; // Ajoutez cette propriété
  };
}
