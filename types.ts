export type ServerResponse = {
  type: string;
  // deno-lint-ignore no-explicit-any
  body: any;
  callerName?: string;
  id?: string
};

export type serverGossipEngineSettingsRespone = {
  new_gossip: number // expected amount of new gossip
}