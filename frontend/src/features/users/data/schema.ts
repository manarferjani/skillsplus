import { z } from 'zod'

const userStatusSchema = z.union([
  z.literal('active'),
  z.literal('inactive'),
  z.literal('suspended'),
])
export type UserStatus = z.infer<typeof userStatusSchema>

const userRoleSchema = z.union([
  z.literal('admin'),
  z.literal('manager'),
  z.literal('collaborator'),
])

const jobPositionSchema = z.enum([
  'fullStackDeveloper',
  'frontendDeveloper',
  'backendDeveloper',
  'unspecified' // Ajout de la valeur
]);
export type JobPosition = z.infer<typeof jobPositionSchema>

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9._-]+$/, "Invalid username format"),
  email: z.string().email(),
  status: userStatusSchema,
  role: userRoleSchema,
  jobPosition: jobPositionSchema.default('unspecified'), // Valeur par défaut requise
  resetPasswordToken: z.string().optional(),
  resetPasswordExpires: z.coerce.date().optional(),

  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  lastLogin: z.string().optional(),  // Ajoutez ceci si la propriété lastLogin est optionnelle
  location: z.string().optional(),  // Ajoutez ceci si la propriété location est optionnelle
  photo: z.string().optional(),  // Ajoutez ceci si la propriété photo est optionnelle
  
})
export type User = z.infer<typeof userSchema>

export const userListSchema = z.array(userSchema)