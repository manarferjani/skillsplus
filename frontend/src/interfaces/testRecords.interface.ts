export interface FormattedParticipation {
  collaborateurNom: string;
  collaborateurEmail: string;
  totalScore: number;
  successRate: number;
  timeSpent: number;
}

export interface TestRecord {
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
