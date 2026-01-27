// src/common/types/result.chain.ts
import { isSuccess, Result, success } from "./result.type";

export class AsyncResultChain<T> {
  constructor(private readonly promise: Promise<Result<T>>) {}

  public static from<T>(promise: Promise<Result<T>>): AsyncResultChain<T> {
    return new AsyncResultChain(promise);
  }

	public then<U>(mapper: (data: T) => Promise<U>): AsyncResultChain<U> {
    return new AsyncResultChain<U>(
      this.promise.then(async (result) => {
        if (!isSuccess(result)) return result; 
        return success(await mapper(result.data));
      })
    );
  }

  public flatThen<U>(mapper: (data: T) => Promise<Result<U>>): AsyncResultChain<U> {
    return new AsyncResultChain<U>(
      this.promise.then(async (result) => {
        if (!isSuccess(result)) return result;
        return mapper(result.data);
      })
    );
  }

	public flatThenAsync<U>(mapper: (data: T) => Promise<Result<U>>): AsyncResultChain<U> {
    return this.flatThen(mapper);
  }

  public async getResult(): Promise<Result<T>> {
    return this.promise;
  }
}

export class ResultChain<T> {
  constructor(private readonly result: Result<T>) {}

  public static of<T>(data: T): ResultChain<T> {
    return new ResultChain(success(data));
  }

  public then<U>(mapper: (data: T) => U): ResultChain<U> {
    if (!isSuccess(this.result)) {
      return new ResultChain(this.result as unknown as Result<U>);
    }
    return new ResultChain<U>(success(mapper(this.result.data)));
  }

  public flatThen<U>(mapper: (data: T) => Result<U>): ResultChain<U> {
    if (!isSuccess(this.result)) {
      return new ResultChain<U>(this.result as unknown as Result<U>);
    }
    return new ResultChain<U>(mapper(this.result.data));
  }

  public flatThenAsync<U>(mapper: (data: T) => Promise<Result<U>>): AsyncResultChain<U> {
    if (!isSuccess(this.result)) {
      return AsyncResultChain.from(Promise.resolve(this.result as unknown as Result<U>));
    }
    return AsyncResultChain.from(mapper(this.result.data));
  }

  public getResult(): Result<T> {
    return this.result;
  }
}
