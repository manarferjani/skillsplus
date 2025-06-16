export interface AppState {
  wasKickedOut?: boolean
  testId?: string
  userId?: string
}

export const validateState = (state: unknown): AppState => {
  if (!state || typeof state !== 'object') {
    return {}
  }

  const result: AppState = {}
  const stateObj = state as Record<string, unknown>

  if ('wasKickedOut' in stateObj) {
    result.wasKickedOut = Boolean(stateObj.wasKickedOut)
  }

  if ('testId' in stateObj && typeof stateObj.testId === 'string') {
    result.testId = stateObj.testId
  }

  if ('userId' in stateObj && typeof stateObj.userId === 'string') {
    result.userId = stateObj.userId
  }

  return result
}