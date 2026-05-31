import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import config from "../../config";
import AppError from "../errors/AppError";
import httpStatus from "http-status";

type TErrorSources = {
  path: string | number;
  message: string;
}[];

const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // default values
  let statusCode = 500;
  let message = "Something went wrong!";
  let errorSources: TErrorSources = [
    {
      path: "",
      message: "Something went wrong",
    },
  ];

  if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation Error";
    errorSources = err.issues.map((issue) => {
      return {
        path: issue.path.join("."),
        message: issue.message,
      };
    });
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorSources = [
      {
        path: req.originalUrl,
        message: err.message,
      },
    ];
  } else if (err?.code === "P2002") {
    statusCode = 409;
    message = "Duplicate Key Error";
    const targetFields = err.meta?.target ? (err.meta.target as string[]).join(", ") : "field";
    errorSources = [
      {
        path: req.originalUrl,
        message: `Unique constraint failed on ${targetFields}`,
      },
    ];
  } else if (err?.code === "P2025") {
    statusCode = 404;
    message = "Record not found";

    errorSources = [
      {
        path: req.originalUrl,
        message: "The requested resource does not exist",
      },
    ];
  } else if (err?.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";

    errorSources = [
      {
        path: req.originalUrl,
        message: "Authentication failed",
      },
    ];
  } else if (err?.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";

    errorSources = [
      {
        path: req.originalUrl,
        message: "Token has expired, please login again",
      },
    ];
  } else if (err instanceof Error) {
    message = err.message;
    errorSources = [
      {
        path: req.originalUrl,
        message: err.message,
      },
    ];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    stack: config.nodeEnv === "development" ? err?.stack : null,
  });
};

export default globalErrorHandler;
