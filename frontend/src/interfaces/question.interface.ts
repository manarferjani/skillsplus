export interface Question {
  questionText: string
  options: string[]
  correctAnswer?: string
  correctAnswers?: string[]
  type: 'single' | 'multiple' | 'code'
  points: number
  level: 'basic' | 'intermediate' | 'expert'; // Ajoutez cette ligne
}

export interface QuizData {
  testId: string
  title: string
  questions: Question[]
}