export abstract class Factory<T> {
  abstract make(input?: unknown): Promise<T>;
  abstract makeMany(fibonacci: number, input?: unknown): Promise<T[]>;
}
