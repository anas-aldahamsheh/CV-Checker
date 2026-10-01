export type StructuredRequest<T> = { system: string; input: string; schema: { parse(value: unknown): T }; timeoutMs?: number };
export type TextRequest = { system: string; input: string; timeoutMs?: number };
export interface AiProvider { generateStructured<T>(request: StructuredRequest<T>): Promise<T>; generateText(request: TextRequest): Promise<string>; }
