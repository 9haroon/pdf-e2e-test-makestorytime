declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      /** Anonymous session identifier used as `user_id` in structured logs */
      sessionUserId?: string;
    }
  }
}

export {};
