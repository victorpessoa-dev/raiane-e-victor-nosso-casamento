export function getUserMessage(error, fallbackMessage) {
  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (error && typeof error === 'object' && typeof error.error === 'string') {
    return error.error;
  }

  return fallbackMessage;
}
