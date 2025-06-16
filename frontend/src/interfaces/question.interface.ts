export interface Question {
  language?: string; // Pour les questions de type code
  questionText: string
  options: string[]
  correctAnswer?: string
  correctAnswers?: string[]
  type: 'single' | 'multiple' | 'code'
  points: number
  level: 'basic' | 'intermediate' | 'expert'; // Ajoutez cette ligne
  duration: number; 
}

export interface QuizData {
  testId: string
  title: string
  questions: Question[]
}

export type Verdict = "✅" | "❌" | "⚠️";



export interface ExigenceFonctionnelle {
  exigence: string;
  statut: Verdict;
  lignes?: string;
  details?: string;
}

export type BonnePratiqueCategorie = "Lisibilité" | "Structure" | "Conventions" | "Performance";

export interface BonnePratique {
  categorie: BonnePratiqueCategorie;
  statut: Verdict;
  details: string;
}

export type PrioriteRecommandation = "Haute" | "Moyenne" | "Basse";

export interface Recommandation {
  priorite: PrioriteRecommandation;
  suggestion: string;
}

export interface Feedback {
  synthese: string; // ✅ car c'est une chaîne
  exigencesFonctionnelles: ExigenceFonctionnelle[];
  bonnesPratiques: BonnePratique[];
  recommandations: Recommandation[];
}


export interface ResponseItem {
  questionText: string;
  questionType: 'single' | 'multiple' | 'code'; 
  response: any;
  isCorrect: boolean;
  score?: number;
  feedback?: Feedback;
}

export interface PopulatedTest {
  _id: string;
  title: string;
}

export interface Submission {
  awardedBadge: string;
  _id: string;
  test: string | PopulatedTest;
  collaborator: string;
  responses: ResponseItem[];
  startTime?: string;
  endTime?: string;
  timeSpent?: string;
  totalScore?: number;
  successRate?: number;
  basicScore?: number;
  intermediateScore?: number;
  expertScore?: number;
  estimatedLevel: "beginner" | "basic" | "intermediate" | "expert";
  createdAt: string;
  updatedAt: string;
  intermediateRate: number;
  expertRate: number;
  basicRate:number
}

export interface SubmittedAnswer {
  questionText: string
  type: 'single' | 'multiple' | 'code'
  submittedAnswer: string | string[]
  feedback: string
  pointsAwarded: number
  codeAnswer?: string
}

export interface ReportData {
  testTitle: string
  questions: Question[]
  submittedAnswers: SubmittedAnswer[]
}
