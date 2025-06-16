// src/features/tests/data/schema.ts
import { z } from 'zod';

export const formattedTestSchema = z.object({
  _id: z.string(), // ou z.number() si c’est un ID numérique
  title: z.string(),
  technology: z.object({
    _id: z.string(),
    name: z.string(),
  }),
  questionsCount: z.number(),
  score: z.number(),
  successRate: z.number(), // exemple : 75.5
  date: z.string(), // ou z.coerce.date() si tu veux un vrai Date
});
