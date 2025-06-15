import { z } from 'zod'

// Schéma pour une option (string[] → pas besoin de schéma Zod ici)
export const optionSchema = z.string()

// Schéma pour une question
export const questionSchema = z.object({
  questionText: z.string(),
  options: z.array(z.string()), // Options sont des strings côté backend
  correctAnswer: z.string().optional(),
  correctAnswers: z.array(z.string()).optional(),
  type: z.enum(['single', 'multiple', 'code']),
  points: z.number()
})

// Schéma pour le quiz complet
export const quizSchema = z.object({
  testId: z.string(),
  title: z.string(),
  questions: z.array(questionSchema)
})