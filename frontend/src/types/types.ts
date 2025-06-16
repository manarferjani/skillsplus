// types.ts
export type UserRole = 'admin' | 'manager' | 'collaborator'

// shared/types.ts
export const userStatuses = ['active', 'inactive', 'suspended', 'blocked', 'pending'] as const;
export type UserStatus = typeof userStatuses[number];