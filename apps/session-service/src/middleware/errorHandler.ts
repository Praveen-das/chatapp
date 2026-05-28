import { Request, Response, NextFunction } from "express";
import { AppError, ValidationError } from "../utils/errors";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("ERROR ----------------->", err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        ...(err instanceof ValidationError && { errors: err.errors }),
      },
    });
  }

  // Handle generic error (e.g. database error, or syntax error)
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "An unexpected error occurred";

  res.status(500).json({
    error: {
      message,
    },
  });
};
