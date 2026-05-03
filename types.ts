export type ServerResponse = {
  type: string;
  // deno-lint-ignore no-explicit-any
  body: any;
  callerName?: string;
  id?: string
};