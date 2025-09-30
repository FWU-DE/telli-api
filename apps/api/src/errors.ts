import { ZodError } from "zod";

export class UnauthorizedError extends Error {
  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string = "Not Found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class InvalidRequestBodyError extends Error {
  constructor(message: string = "Invalid Request Body") {
    super(message);
    this.name = "InvalidRequestBodyError";
  }
}

export function handleApiError(error: unknown) {
  console.error("API ERROR:", error);
  if (error instanceof UnauthorizedError) {
    return { statusCode: 401, message: error.message };
  } else if (error instanceof NotFoundError) {
    return { statusCode: 404, message: error.message };
  } else if (isZodError(error)) {
    return {
      statusCode: 400,
      message: error.errors.map((e) => e.message).join(", "),
    };
  } else if (error instanceof InvalidRequestBodyError) {
    return { statusCode: 400, message: error.message };
  } else if (error instanceof Error) {
    return { statusCode: 500, message: error.message };
  } else {
    return { statusCode: 500, message: "An unknown error occurred." };
  }
}

export function isZodError(err: unknown): err is ZodError {
  return Boolean(
    err && (err instanceof ZodError || err.constructor.name === ZodError.name),
  );
}
