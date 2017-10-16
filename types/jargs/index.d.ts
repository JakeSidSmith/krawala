declare module 'jargs' {

  export type collect = (rootNode: Help | Program) => Tree;

  export interface ArgsOrKWArgs {
    [index: string]: string | undefined;
  }

  export interface Flags {
    [index: string]: true | undefined;
  }

  export interface Tree {
    name: string;
    command: Tree;
    kwargs: ArgsOrKWArgs;
    flags: Flags;
    args: ArgsOrKWArgs;
  }

  export interface HelpProps {
    description?: string;
    alias?: string;
  }

  export interface ProgramProps {
    description?: string;
    usage?: string;
    examples?: string[];
    callback: (tree: Tree) => any;
  }

  export interface CommandProps {
    description?: string;
    alias?: string;
    usage?: string;
    examples?: string[];
    callback: (tree: Tree) => any;
  }

  export interface KWArgProps {
    description?: string;
    alias?: string;
    options?: string[];
    type?: string;
  }

  export interface FlagProps {
    description?: string;
    alias?: string;
  }

  export interface ArgProps {
    description?: string;
    options?: string[];
    type?: string;
  }

  export type RequiredChild = Command | KWArg | Flag | Arg;
  export type ProgramOrCommandChild = Command | KWArg | Flag | Arg | Required | RequireAll | RequireAny;

  export type Help = (name: string, props: HelpProps, program: Program) => Tree;
  export type Program = (name: string, props: ProgramProps, ...nodes: ProgramOrCommandChild[]) => Tree;
  export type Command = (name: string, props: CommandProps, ...nodes: ProgramOrCommandChild[]) => Tree;
  export type KWArg = (name: string, props: KWArgProps) => Tree;
  export type Flag = (name: string, props: FlagProps) => Tree;
  export type Arg = (name: string, props: ArgProps) => Tree;
  export type Required = (node: RequiredChild) => Tree;
  export type RequireAll = (...nodes: RequiredChild[]) => Tree;
  export type RequireAny = (...nodes: RequiredChild[]) => Tree;

}
