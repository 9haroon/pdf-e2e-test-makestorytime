import type { NextFunction, Request, Response } from "express";
import { logError, requestLogFields } from "../../utils/logger.js";

export class HttpError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Sends JSON errors suitable for end users — never exposes stack traces in HTTP responses.
 * Full context is logged server-side.
 */
export function errorHandlerMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const fields = requestLogFields(req);
  if (err instanceof HttpError) {
    logError(
      fields,
      "Handled HttpError",
      err,
      { httpStatus: err.statusCode, code: err.code }
    );
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
    return;
  }
  logError(fields, "Unhandled error", err, {});
  res.status(500).json({
    error: {
      code: "internal_error",
      message: "Something went wrong. Please try again in a moment.",
    },
  });
}
