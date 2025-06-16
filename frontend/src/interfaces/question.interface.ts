export interface Question {
    questionText: string;    // Le texte de la question
    options: string[];       // Un tableau contenant les options de réponse (chaînes)
    correctAnswer: string;   // La réponse correcte
    points: number;          // Le nombre de points associés à cette question
  }
  