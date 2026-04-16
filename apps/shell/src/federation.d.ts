declare module '__federation__' {
  export function __federation_method_setRemote(
    name: string,
    config: { url: string; format: string; from: string }
  ): void;
  export function __federation_method_ensure(id: string): Promise<void>;
  export function __federation_method_getRemote(id: string, expose: string): Promise<unknown>;
  export function __federation_method_unwrapDefault(module: unknown): unknown;
}
