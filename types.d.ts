declare module "node:fs" {
  export function mkdtempSync(prefix: string): string
}

declare module "node:fs/promises" {
  export function rm(path: string, options?: { force?: boolean; recursive?: boolean }): Promise<void>
}

declare module "node:os" {
  export function tmpdir(): string
}

declare module "node:path" {
  export function join(...paths: string[]): string
}

declare module "bun:test" {
  export function afterEach(fn: () => Promise<void> | void): void
  export function describe(name: string, fn: () => Promise<void> | void): void
  export function test(name: string, fn: () => Promise<void> | void): void
  export function expect(value: unknown): {
    toEqual(expected: unknown): void
    toHaveLength(expected: number): void
    toContain(expected: string): void
  }
}

type BunFile = Blob & {
  readonly size: number
  exists(): Promise<boolean>
  text(): Promise<string>
}

type BunSubprocess = {
  readonly stdout: ReadableStream<Uint8Array>
  readonly stderr: ReadableStream<Uint8Array>
  readonly exited: Promise<number>
}

declare const Bun: {
  file(path: string): BunFile
  serve(options: {
    port: number
    fetch(request: Request): Response | Promise<Response>
  }): {
    readonly port: number
    stop(force?: boolean): void
  }
  spawn(options: {
    cmd: string[]
    stdout?: "ignore" | "pipe"
    stderr?: "ignore" | "pipe"
    signal?: AbortSignal
    killSignal?: string
  }): BunSubprocess
}

declare const process: {
  env: Record<string, string | undefined>
}
