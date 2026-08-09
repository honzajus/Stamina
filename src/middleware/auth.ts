import { NextFunction, Request, Response } from "express";
import { verifyAuthToken } from "../lib/jwt";
import { ApiError } from "../lib/errors";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(ApiError.unauthorized("Missing bearer token"));
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = verifyAuthToken(token);
    req.userId = payload.userId;
    next();
  } catch {
    next(ApiError.unauthorized("Invalid or expired token"));
  }
}

/** Attaches req.userId when a valid token is present, but never rejects the request. */
export function attachAuthIfPresent(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    try {
      const payload = verifyAuthToken(header.slice("Bearer ".length));
      req.userId = payload.userId;
    } catch {
      // no-op: request proceeds unauthenticated
    }
  }
  next();
}
