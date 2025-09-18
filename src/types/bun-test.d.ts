declare module 'bun:test' {
  export function test(name: string, fn: () => void | Promise<void>): void;
  export function test(fn: () => void | Promise<void>): void;
  
  export const expect: {
    (value: any): {
      toBe(expected: any): void;
      toBeDefined(): void;
      toBeUndefined(): void;
      toBeNull(): void;
      toBeTruthy(): void;
      toBeFalsy(): void;
      toEqual(expected: any): void;
      toStrictEqual(expected: any): void;
      toContain(expected: any): void;
      toThrow(expected?: any): void;
      toHaveLength(expected: number): void;
      toHaveProperty(property: string, value?: any): void;
      toBeGreaterThan(expected: number): void;
      toBeGreaterThanOrEqual(expected: number): void;
      toBeLessThan(expected: number): void;
      toBeLessThanOrEqual(expected: number): void;
      toBeCloseTo(expected: number, precision?: number): void;
      toMatch(expected: string | RegExp): void;
      toMatchObject(expected: object): void;
      not: any;
    };
  };
  
  export function describe(name: string, fn: () => void): void;
  export function beforeAll(fn: () => void | Promise<void>): void;
  export function afterAll(fn: () => void | Promise<void>): void;
  export function beforeEach(fn: () => void | Promise<void>): void;
  export function afterEach(fn: () => void | Promise<void>): void;
}