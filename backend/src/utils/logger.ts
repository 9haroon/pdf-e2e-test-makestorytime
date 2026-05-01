import { randomUUID } from "crypto";
import type { Request, Response, NextFunction } from "express";

export const REQUEST_ID_HEADER = "x-request-id";

export interface LogFields {
  request_id: string;
  user_id?: string;
  timestamp: string;
}

function isoNow(): string {
  return new Date().toISOString();
}

export function logInfo(
  fields: LogFields,
  message: string,
  extra?: Record<string, unknown>
): void {
  console.log(
    JSON.stringify({
      level: "info",
      message,
      ...fields,
      ...extra,
    })
  );
}

export function logError(
  fields: LogFields,
  message: string,
  err: unknown,
  extra?: Record<string, unknown>
): void {
  const payload: Record<string, unknown> = {
    level: "error",
    message,
    ...fields,
    ...extra,
  };
  if (err instanceof Error) {
    payload.error_name = err.name;
    payload.error_message = err.message;
    payload.stack = err.stack;
  } else {
    payload.error_message = String(err);
  }
  console.error(JSON.stringify(payload));
}

/** Attach `x-request-id` and optional `user_id` from session header for downstream handlers */
export function requestContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const headerId = req.header(REQUEST_ID_HEADER);
  const requestId =
    typeof headerId === "string" && headerId.length > 0 ? headerId : randomUUID();
  res.setHeader(REQUEST_ID_HEADER, requestId);
  const sessionHeader = req.header("x-session-id");
  const userId =
    typeof sessionHeader === "string" && sessionHeader.length > 0
      ? sessionHeader
      : undefined;
  req.requestId = requestId;
  req.sessionUserId = userId;
  next();
}

export function requestLogFields(req: Request): LogFields {
  return {
    request_id: req.requestId ?? randomUUID(),
    user_id: req.sessionUserId,
    timestamp: isoNow(),
  };
}
