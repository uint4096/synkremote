import type { Pattern } from "fast-glob";
interface File {
  name: string;
  content: Buffer;
}

export interface Message {
  File: {
    encode: (file: File) => Buffer;
    decode: (message: Buffer, offset: number, length: number) => File;
  };
}

export interface ServerArgs {
  port?: number;
  rootDir?: string;
  bindIp?: string;
  help?: string;
}

type FileArg = {
  file: string;
  dir?: never;
};

type DirArg = {
  dir: string;
  file?: never;
};

export type FileOrDir = DirArg | FileArg;

interface Options {
  addr?: string;
  host?: string;
  port?: string;
  include?: Pattern;
  exclude?: Pattern;
  remoteDir?: string;
  help?: string;
}

export type ClientOptions = Options & FileOrDir;

export type CliArgs = ServerArgs & ClientOptions & { _: Array<string> };

export type ClientArgs = Required<
  Omit<Options, "host" | "port" | "include" | "exclude" | "help">
> & {
  include: Array<Pattern>;
  exclude: Array<Pattern>;
} & FileOrDir;
