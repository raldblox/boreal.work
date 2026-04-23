export type AgentTool<Name extends string, Input, Output> = {
  name: Name;
  description: string;
  execute: (input: Input) => Promise<Output>;
};

export type ComposableAgent<
  Name extends string,
  Tools extends readonly unknown[],
  Input,
  Output,
> = {
  name: Name;
  description: string;
  tools: Tools;
  run: (input: Input) => Promise<Output>;
};
