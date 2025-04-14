export class GoogleCalendarError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly context?: string
  ) {
    super(message);
    this.name = "GoogleCalendarError";
  }
}

export const handleGoogleCalendarError = (
  error: unknown,
  context: string
): never => {
  if (error instanceof GoogleCalendarError) {
    throw error;
  }

  const message = error instanceof Error ? error.message : String(error);
  throw new GoogleCalendarError(message, undefined, context);
};
