import { z } from 'zod'
import { userStatuses } from '@/types/types'

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
  z.literal('unspecified'),
])

const jobPositionSchema = z.enum([
  'fullStackDeveloper',
  'frontendDeveloper',
  'backendDeveloper',
  'unspecified'
]);
export type JobPosition = z.infer<typeof jobPositionSchema>

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  gender: z.enum(['male', 'female', 'other']),
  username: z.string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9._-]+$/, "Invalid username format"),
  email: z.string().email(),
  bio: z.string().optional(),
  urls: z.array(
    z.object({
      label: z.string(),
      url: z.string().url(),
    })
  ).optional(),
  status: z.enum(userStatuses, {
  errorMap: () => ({ message: 'Status is required' }),
}),
  role: userRoleSchema,
  jobPosition: jobPositionSchema.default('unspecified'), // Valeur par défaut requise
  resetPasswordToken: z.string().optional(),
  resetPasswordExpires: z.coerce.date().optional(),
  level: z.string().default('beginner'),

  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  lastLogin: z.string().optional(),
  location: z.string().optional(),
  profileImage: z
    .union([
      z.string().url(),
      z.string().startsWith('/'),
      z.literal('')
    ])
    .optional()
    .nullable()
    .transform(val => val || undefined) // Convertit null/'' en undefined
    .refine(
      val => !val || val.startsWith('http') || val.startsWith('/'),
      { message: 'Doit être une URL valide ou un chemin relatif' }
    ),


})
export type User = z.infer<typeof userSchema>

export const userListSchema = z.array(userSchema)