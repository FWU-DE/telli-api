export type Ok<T> = { ok: true; value: T };
export type Err<E> = { ok: false; error: E };

export function createOk<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export function createErr<E>(error: E): Err<E> {
  return { ok: false, error };
}

export class Result<T, E> {
  // eslint-disable-next-line no-unused-vars
  private constructor(private readonly result: Ok<T> | Err<E>) {}

  static Ok<T>(value: T): Result<T, never> {
    return new Result({ ok: true, value });
  }

  static Err<E>(error: E): Result<never, E> {
    return new Result({ ok: false, error });
  }

  isOk(): boolean {
    return this.result.ok;
  }

  isErr(): boolean {
    return !this.result.ok;
  }

  unwrap(): T {
    if (this.result.ok) {
      return this.result.value;
    }
    throw new Error("Tried to unwrap an Err value");
  }

  unwrapOr(defaultValue: T): T {
    return this.result.ok ? this.result.value : defaultValue;
  }

  // eslint-disable-next-line no-unused-vars
  map<U>(fn: (value: T) => U): Result<U, E> {
    return this.result.ok
      ? Result.Ok(fn(this.result.value))
      : (this as unknown as Result<U, E>);
  }

  // eslint-disable-next-line no-unused-vars
  mapErr<F>(fn: (error: E) => F): Result<T, F> {
    return this.result.ok
      ? (this as unknown as Result<T, F>)
      : Result.Err(fn(this.result.error));
  }

  // eslint-disable-next-line no-unused-vars
  match<U>(cases: { Ok: (value: T) => U; Err: (error: E) => U }): U {
    return this.result.ok
      ? cases.Ok(this.result.value)
      : cases.Err(this.result.error);
  }
}

// eslint-disable-next-line no-unused-vars
export function executeAsync<F extends (...args: any[]) => Promise<any>>(
  fn: F,
): (
  // eslint-disable-next-line no-unused-vars
  ...args: Parameters<F>
) => Promise<Result<Awaited<ReturnType<F>>, unknown>> {
  return async (...args: Parameters<F>) => {
    try {
      const value = await fn(...args);
      return Result.Ok(value);
    } catch (error) {
      return Result.Err(error);
    }
  };
}

// eslint-disable-next-line no-unused-vars
export function resultifyAsyncPlain<F extends (...args: any[]) => Promise<any>>(
  fn: F,
): (
  // eslint-disable-next-line no-unused-vars
  ...args: Parameters<F>
) => Promise<PlainResult<Awaited<ReturnType<F>>, unknown>> {
  return async (...args: Parameters<F>) => {
    try {
      const value = await fn(...args);
      return { ok: true, value }; // Always return a plain object
    } catch (error) {
      return { ok: false, error: error as unknown }; // Ensure serialization safety
    }
  };
}

export type PlainResult<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function fromPlainResult<T, E>(plain: PlainResult<T, E>): Result<T, E> {
  return plain.ok ? Result.Ok(plain.value) : Result.Err(plain.error);
}
