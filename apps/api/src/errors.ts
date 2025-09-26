import { z } from "zod";

export class UnauthorizedError extends Error {
  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return { statusCode: 401, message: error.message };
  } else if (error instanceof z.ZodError) {
    return {
      statusCode: 400,
      message: error.errors.map((e) => e.message).join(", "),
    };
  } else if (error instanceof Error) {
    return { statusCode: 500, message: error.message };
  } else {
    return { statusCode: 500, message: "An unknown error occurred." };
  }
}
