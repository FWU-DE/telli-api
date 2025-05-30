import { getErrorMessage } from "./error-utils";

export type Result<T> = [Error, null] | [null, T];
export type AsyncResult<T> = Promise<Result<T>>;

// eslint-disable-next-line no-unused-vars
export function errorifyAsyncFn<F extends (...args: any[]) => Promise<any>>(
  fn: F,
  // eslint-disable-next-line no-unused-vars
): (...args: Parameters<F>) => Promise<Result<Awaited<ReturnType<F>>>> {
  return async (...args: Parameters<F>) => {
    try {
      const value = await fn(...args);
      return [null, value];
    } catch (error) {
      if (error instanceof Error) {
        return [error, null];
      }
      return [new Error(getErrorMessage(error)), null];
    }
  };
}

// eslint-disable-next-line no-unused-vars
export function errorifyFn<F extends (...args: any[]) => any>(
  fn: F,
  // eslint-disable-next-line no-unused-vars
): (...args: Parameters<F>) => Result<ReturnType<F>> {
  return (...args: Parameters<F>) => {
    try {
      const value = fn(...args);
      return [null, value];
    } catch (error) {
      if (error instanceof Error) {
        return [error, null];
      }
      return [new Error(getErrorMessage(error)), null];
    }
  };
}
