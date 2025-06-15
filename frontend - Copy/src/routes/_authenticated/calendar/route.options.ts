export const validateState = (
  state: unknown
): { wasKickedOut?: boolean; testId?: string ;userId?: string} => {
  if (!state || typeof state !== 'object') {
    return {}
  }

  const copy = { ...state } as any

  if ('wasKickedOut' in copy) {
    const value = copy.wasKickedOut
    if (typeof value !== 'boolean') {
      delete copy.wasKickedOut
    } else {
      copy.wasKickedOut = Boolean(value)
    }
  }

  // ✅ Si testId est présent, on le garde
  let testId: string | undefined
  if ('testId' in copy && typeof copy.testId === 'string') {
    testId = copy.testId
  }

    // ✅ Si testId est présent, on le garde
  let userId: string | undefined
  if ('userId' in copy && typeof copy.testId === 'string') {
    userId = copy.userId
  }

  return {
    wasKickedOut: copy.wasKickedOut,
    testId: testId ?? undefined,
    userId: userId ?? undefined,
  }
}