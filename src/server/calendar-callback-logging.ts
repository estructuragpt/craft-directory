import { CalendarConfigurationError, CalendarProviderError, type CalendarConfigurationErrorCode } from "./google-calendar";

export type CalendarCallbackStage = "database" | "token_exchange" | "encryption" | "state_validation";
export type CalendarCallbackFailureCode = CalendarConfigurationErrorCode | "token_exchange_rejected" | "database_persist_failed" | "encryption_failed" | "unknown_failure";

export function classifyCalendarCallbackFailure(error: unknown, stage: CalendarCallbackStage): CalendarCallbackFailureCode {
  if (error instanceof CalendarConfigurationError) return error.code;
  if (error instanceof CalendarProviderError || stage === "token_exchange") return "token_exchange_rejected";
  if (stage === "database") return "database_persist_failed";
  if (stage === "encryption") return "encryption_failed";
  return "unknown_failure";
}

export function logCalendarCallbackFailure(error: unknown, stage: CalendarCallbackStage, write: (message: string) => void = console.error) {
  // Only fixed values are emitted: Error objects can contain OAuth codes, tokens, or database details.
  write(JSON.stringify({ level: "error", event: "google_calendar_oauth_callback_failed", code: classifyCalendarCallbackFailure(error, stage) }));
}
